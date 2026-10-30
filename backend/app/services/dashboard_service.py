from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.lembrete_config import LembreteConfig
from app.models.refeicao import Refeicao
from app.models.item_refeicao import ItemRefeicao
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.repositories.registro_agua_repo import RegistroAguaRepository
from app.repositories.historico_progresso_repo import HistoricoProgressoRepository
from app.repositories.refeicao_repo import RefeicaoRepository
from app.services.nutricao_service import NutricaoService

_META_AGUA_PADRAO = 2000.0
_CAMPOS_MACRO = ("calorias", "carboidratos", "proteinas", "gorduras")


def _macros_vazios() -> dict[str, float]:
    return {campo: 0.0 for campo in _CAMPOS_MACRO}


class DashboardService:

    def __init__(self, db: Session):
        self.db = db
        self.meta_repo = MetaNutriRepository(db)
        self.agua_repo = RegistroAguaRepository(db)
        self.progresso_repo = HistoricoProgressoRepository(db)
        self.refeicao_repo = RefeicaoRepository(db)

    def _meta_agua_diaria(self, id_usuario: UUID | str) -> float:
        config = self.db.query(LembreteConfig).filter(
            LembreteConfig.id_usuario == str(id_usuario)
        ).first()
        return config.agua_meta_diaria_ml if config else _META_AGUA_PADRAO

    def _somar_item(self, total: dict[str, float], item: ItemRefeicao) -> None:
        macros = NutricaoService.calcular_macros_item(
            calorias_porcao=item.alimento.calorias,
            carb_porcao=item.alimento.carboidratos,
            prot_porcao=item.alimento.proteinas,
            gord_porcao=item.alimento.gorduras,
            porcao_padrao_g=item.alimento.porcao_padrao_g,
            quantidade_g=item.quantidade_alimento_g,
        )
        for campo in _CAMPOS_MACRO:
            total[campo] += macros[campo]

    def _macros_consumidos_refeicoes(self, refeicoes: list[Refeicao]) -> dict[str, float]:
        total = _macros_vazios()
        for refeicao in refeicoes:
            for item in refeicao.itens:
                self._somar_item(total, item)
        return {campo: round(valor, 2) for campo, valor in total.items()}

    def _streak_dias(self, id_usuario: UUID | str, data_base: date) -> int:
        """Contagem de dias consecutivos com pelo menos um alimento registrado."""
        dias = (
            self.db.query(Refeicao.data_refeicao)
            .join(ItemRefeicao, ItemRefeicao.id_refeicao == Refeicao.id_refeicao)
            .filter(Refeicao.id_usuario == str(id_usuario), Refeicao.data_refeicao <= data_base)
            .distinct()
            .order_by(Refeicao.data_refeicao.desc())
            .all()
        )
        streak = 0
        esperado = data_base
        for (dia,) in dias:
            if dia != esperado:
                break
            streak += 1
            esperado -= timedelta(days=1)
        return streak

    def _percentual(self, consumido: float, meta: float) -> float:
        if meta <= 0:
            return 0.0
        return round((consumido / meta) * 100, 1)

    def resumo_dia(self, id_usuario: UUID | str, data: date | None = None) -> dict:
        data = data or date.today()
        meta = self.meta_repo.get_meta_atual(id_usuario)

        refeicoes_dia = self.refeicao_repo.get_by_dia(id_usuario, data)
        macros_consumidos = self._macros_consumidos_refeicoes(refeicoes_dia)
        agua_ml = self.agua_repo.get_total_dia(id_usuario, data)
        meta_agua = self._meta_agua_diaria(id_usuario)
        streak = self._streak_dias(id_usuario, data)

        meta_macros = {
            "calorias": meta.calorias_diarias if meta else 0,
            "carboidratos": meta.carboidrato_g if meta else 0,
            "proteinas": meta.proteina_g if meta else 0,
            "gorduras": meta.gordura_g if meta else 0,
        }

        consumido = {
            "calorias": macros_consumidos["calorias"],
            "carboidratos": macros_consumidos["carboidratos"],
            "proteinas": macros_consumidos["proteinas"],
            "gorduras": macros_consumidos["gorduras"],
        }

        restante = {k: round(meta_macros[k] - consumido[k], 2) for k in consumido}

        percentuais = {
            "calorias": self._percentual(consumido["calorias"], meta_macros["calorias"]),
            "carboidratos": self._percentual(consumido["carboidratos"], meta_macros["carboidratos"]),
            "proteinas": self._percentual(consumido["proteinas"], meta_macros["proteinas"]),
            "gorduras": self._percentual(consumido["gorduras"], meta_macros["gorduras"]),
            "agua": self._percentual(agua_ml, meta_agua),
        }

        return {
            "data": str(data),
            "meta_definida": meta is not None,
            "macros": {
                "consumido": consumido,
                "meta": meta_macros,
                "restante": restante,
                "percentual": percentuais["calorias"],
                "percentual_por_macronutriente": {
                    "carboidratos": percentuais["carboidratos"],
                    "proteinas": percentuais["proteinas"],
                    "gorduras": percentuais["gorduras"],
                },
            },
            "agua": {
                "consumido_ml": round(agua_ml, 2),
                "meta_ml": round(meta_agua, 2),
                "restante_ml": round(meta_agua - agua_ml, 2),
                "percentual": percentuais["agua"],
            },
            "refeicoes_registradas": len(refeicoes_dia),
            "streak_dias": streak,
        }

    def evolucao_peso(self, id_usuario: UUID | str, limit: int = 30) -> list[dict]:
        historico = self.progresso_repo.get_by_usuario(id_usuario, skip=0, limit=limit)
        historico = sorted(historico, key=lambda h: h.data_registro)
        return [
            {"data": str(h.data_registro), "peso_kg": h.peso_atual}
            for h in historico
        ]

    def _resumo_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> dict:
        meta = self.meta_repo.get_meta_atual(id_usuario)
        meta_calorias = meta.calorias_diarias if meta else 0
        datas = []
        dia = data_inicio
        while dia <= data_fim:
            datas.append(dia)
            dia += timedelta(days=1)

        totais_por_dia = {data: _macros_vazios() for data in datas}
        refeicoes = self.refeicao_repo.get_by_periodo(id_usuario, data_inicio, data_fim)
        for refeicao in refeicoes:
            total = totais_por_dia[refeicao.data_refeicao]
            for item in refeicao.itens:
                self._somar_item(total, item)

        agua_por_dia = self.agua_repo.get_totais_por_periodo(id_usuario, data_inicio, data_fim)
        dias = []
        for dia in datas:
            calorias = round(totais_por_dia[dia]["calorias"], 2)
            dias.append({
                "data": str(dia),
                "calorias": calorias,
                "meta_calorias": meta_calorias,
                "percentual": self._percentual(calorias, meta_calorias),
            })

        return {
            "data_inicio": str(data_inicio),
            "data_fim": str(data_fim),
            "dias": dias,
            "agua_total_ml": round(sum(agua_por_dia.values()), 2),
        }

    def resumo_semana(self, id_usuario: UUID | str, data_fim: date | None = None) -> dict:
        data_fim = data_fim or date.today()
        return self._resumo_periodo(id_usuario, data_fim - timedelta(days=6), data_fim)

    def resumo_mes(self, id_usuario: UUID | str, data_fim: date | None = None) -> dict:
        data_fim = data_fim or date.today()
        return self._resumo_periodo(id_usuario, data_fim - timedelta(days=30), data_fim)
