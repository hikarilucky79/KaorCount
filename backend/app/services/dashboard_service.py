from datetime import date, timedelta
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.lembrete_config import LembreteConfig
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.repositories.registro_agua_repo import RegistroAguaRepository
from app.repositories.historico_progresso_repo import HistoricoProgressoRepository
from app.repositories.refeicao_repo import RefeicaoRepository
from app.repositories.item_refeicao_repo import ItemRefeicaoRepository
from app.services.nutricao_service import NutricaoService

_META_AGUA_PADRAO = 2000.0
_STREAK_MAX_DIAS = 30


class DashboardService:

    def __init__(self, db: Session):
        self.db = db
        self.meta_repo = MetaNutriRepository(db)
        self.agua_repo = RegistroAguaRepository(db)
        self.progresso_repo = HistoricoProgressoRepository(db)
        self.refeicao_repo = RefeicaoRepository(db)
        self.item_repo = ItemRefeicaoRepository(db)

    def _meta_agua_diaria(self, id_usuario: UUID | str) -> float:
        config = self.db.query(LembreteConfig).filter(
            LembreteConfig.id_usuario == str(id_usuario)
        ).first()
        return config.agua_meta_diaria_ml if config else _META_AGUA_PADRAO

    def _macros_consumidos_dia(self, id_usuario: UUID | str, data: date) -> dict:
        refeicoes = self.refeicao_repo.get_by_dia(id_usuario, data)
        total = {"calorias": 0.0, "carboidratos": 0.0, "proteinas": 0.0, "gorduras": 0.0}

        for refeicao in refeicoes:
            for item in self.item_repo.get_by_refeicao(refeicao.id_refeicao):
                macros = NutricaoService.calcular_macros_item(
                    calorias_porcao=item.alimento.calorias,
                    carb_porcao=item.alimento.carboidratos,
                    prot_porcao=item.alimento.proteinas,
                    gord_porcao=item.alimento.gorduras,
                    porcao_padrao_g=item.alimento.porcao_padrao_g,
                    quantidade_g=item.quantidade_alimento_g,
                )
                for k in total:
                    total[k] += macros[k]

        return {k: round(v, 2) for k, v in total.items()}

    def _streak_dias(self, id_usuario: UUID | str, data_base: date) -> int:
        """Contagem de dias consecutivos com pelo menos uma refeição registrada."""
        streak = 0
        dia = data_base
        for _ in range(_STREAK_MAX_DIAS):
            if self.refeicao_repo.get_by_dia(id_usuario, dia):
                streak += 1
                dia = dia - timedelta(days=1)
            else:
                break
        return streak

    def _percentual(self, consumido: float, meta: float) -> float:
        if meta <= 0:
            return 0.0
        return round((consumido / meta) * 100, 1)

    def resumo_dia(self, id_usuario: UUID | str, data: date | None = None) -> dict:
        data = data or date.today()
        meta = self.meta_repo.get_meta_atual(id_usuario)

        macros_consumidos = self._macros_consumidos_dia(id_usuario, data)
        agua_ml = self.agua_repo.get_total_dia(id_usuario, data)
        meta_agua = self._meta_agua_diaria(id_usuario)
        refeicoes_dia = self.refeicao_repo.get_by_dia(id_usuario, data)
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

    def resumo_semana(self, id_usuario: UUID | str, data_fim: date | None = None) -> dict:
        data_fim = data_fim or date.today()
        data_inicio = data_fim - timedelta(days=6)

        dias = []
        meta = self.meta_repo.get_meta_atual(id_usuario)
        meta_calorias = meta.calorias_diarias if meta else 0

        dia = data_inicio
        agua_total = 0.0
        while dia <= data_fim:
            macros = self._macros_consumidos_dia(id_usuario, dia)
            agua_total += self.agua_repo.get_total_dia(id_usuario, dia)
            dias.append({
                "data": str(dia),
                "calorias": macros["calorias"],
                "meta_calorias": meta_calorias,
                "percentual": self._percentual(macros["calorias"], meta_calorias),
            })
            dia += timedelta(days=1)

        return {
            "data_inicio": str(data_inicio),
            "data_fim": str(data_fim),
            "dias": dias,
            "agua_total_ml": round(agua_total, 2),
        }

    def resumo_mes(self, id_usuario: UUID | str, data_fim: date | None = None) -> dict:
        data_fim = data_fim or date.today()
        data_inicio = data_fim - timedelta(days=30)

        dias = []
        meta = self.meta_repo.get_meta_atual(id_usuario)
        meta_calorias = meta.calorias_diarias if meta else 0

        dia = data_inicio
        agua_total = 0.0
        while dia <= data_fim:
            macros = self._macros_consumidos_dia(id_usuario, dia)
            agua_total += self.agua_repo.get_total_dia(id_usuario, dia)
            dias.append({
                "data": str(dia),
                "calorias": macros["calorias"],
                "meta_calorias": meta_calorias,
                "percentual": self._percentual(macros["calorias"], meta_calorias),
            })
            dia += timedelta(days=1)

        return {
            "data_inicio": str(data_inicio),
            "data_fim": str(data_fim),
            "dias": dias,
            "agua_total_ml": round(agua_total, 2),
        }
