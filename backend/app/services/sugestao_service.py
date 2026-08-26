import json
from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.models.sugestao_refeicao import SugestaoRefeicao
from app.repositories.perfil_nutri_repo import PerfilNutriRepository
from app.repositories.meta_nutri_repo import MetaNutriRepository
from app.repositories.alimento_repo import AlimentoRepository
from app.services.fatsecret_service import FatSecretService
from app.services.nutricao_service import NutricaoService
from fastapi import HTTPException, status


class SugestaoService:

    # Configuração das refeições: (nome, % das calorias diárias)
    REFEICOES_CONFIG = [
        ("Café da manhã", 0.25),
        ("Almoço", 0.35),
        ("Jantar", 0.30),
        ("Lanche", 0.10),
    ]

    # Termos de busca por tipo de refeição (para FatSecret)
    BUSCA_POR_TIPO = {
        "Café da manhã": ["ovos", "aveia", "iogurte", "pão integral", "frutas", "vitamina", "granola", "queijo"],
        "Almoço": ["arroz feijão", "frango grelhado", "peixe", "carne magra", "salada", "quinoa", "batata doce", "legumes"],
        "Jantar": ["omelete", "sopa", "sanduíche natural", "wrap", "salada proteína", "peixe assado", "frango desfiado"],
        "Lanche": ["banana", "pasta amendoim", "iogurte proteico", "castanhas", "barrinha cereal", "whey", "frutas secas"],
    }

    def __init__(self, db: Session):
        self.db = db
        self.perfil_repo = PerfilNutriRepository(db)
        self.meta_repo = MetaNutriRepository(db)
        self.alimento_repo = AlimentoRepository(db)

    def _buscar_alimentos_fatsecret(self, termo: str, max_resultados: int = 20) -> List[Dict]:
        """Busca alimentos no FatSecret."""
        try:
            resultado = FatSecretService.buscar_alimentos(termo, pagina=0, max_resultados=max_resultados)
            return resultado.get("alimentos", [])
        except Exception:
            return []

    def _filtrar_alimentos_por_macros(
        self,
        alimentos: List[Dict],
        meta_calorias: float,
        meta_carb: float,
        meta_prot: float,
        meta_gord: float,
        tolerancia: float = 0.3
    ) -> List[Dict]:
        """Filtra alimentos que se encaixam nas macros alvo (com tolerância)."""
        filtrados = []
        for a in alimentos:
            cal = a.get("calorias", 0) or 0
            carb = a.get("carboidratos", 0) or 0
            prot = a.get("proteinas", 0) or 0
            gord = a.get("gorduras", 0) or 0
            
            # Pula alimentos sem dados nutricionais
            if cal == 0:
                continue
            
            # Verifica se está dentro da tolerância das macros por grama
            # Calcula densidade calórica
            cal_por_g = cal / max(a.get("quantidade_metrica", 100), 1)
            
            filtrados.append({
                "nome": a.get("nome") or a.get("food_name"),
                "marca": a.get("marca") or a.get("brand_name", ""),
                "calorias": cal,
                "carboidratos": carb,
                "proteinas": prot,
                "gorduras": gord,
                "quantidade_metrica": a.get("quantidade_metrica", 100),
                "unidade_metrica": a.get("unidade_metrica", "g"),
                "food_id": a.get("food_id"),
            })
        return filtrados

    def _selecionar_combinacao_otima(
        self,
        alimentos: List[Dict],
        alvo_cal: float,
        alvo_carb: float,
        alvo_prot: float,
        alvo_gord: float,
        max_itens: int = 4
    ) -> List[Dict]:
        """
        Seleciona combinação de alimentos que melhor atinge as macros alvo.
        Algoritmo guloso simples: ordena por proximidade e adiciona até atingir alvo.
        """
        if not alimentos:
            return []
        
        # Score de proximidade às macros alvo (por 100g)
        for a in alimentos:
            q = max(a["quantidade_metrica"], 1) / 100.0
            a["_score"] = abs(a["calorias"] * q - alvo_cal) + \
                          abs(a["carboidratos"] * q - alvo_carb) + \
                          abs(a["proteinas"] * q - alvo_prot) + \
                          abs(a["gorduras"] * q - alvo_gord)
        
        alimentos.sort(key=lambda x: x["_score"])
        
        selecionados = []
        cal_atual = carb_atual = prot_atual = gord_atual = 0.0
        
        for a in alimentos[:max_itens * 3]:  # Considera top candidatos
            if len(selecionados) >= max_itens:
                break
            
            q = max(a["quantidade_metrica"], 1) / 100.0
            cal_item = a["calorias"] * q
            carb_item = a["carboidratos"] * q
            prot_item = a["proteinas"] * q
            gord_item = a["gorduras"] * q
            
            # Verifica se adicionar não estoura muito o alvo (com margem 20%)
            if (cal_atual + cal_item <= alvo_cal * 1.2 and
                carb_atual + carb_item <= alvo_carb * 1.2 and
                prot_atual + prot_item <= alvo_prot * 1.2 and
                gord_atual + gord_item <= alvo_gord * 1.2):
                
                selecionados.append({
                    **a,
                    "quantidade_sugerida_g": round(a["quantidade_metrica"], 1),
                    "calorias_item": round(cal_item, 1),
                    "carb_item": round(carb_item, 1),
                    "prot_item": round(prot_item, 1),
                    "gord_item": round(gord_item, 1),
                })
                cal_atual += cal_item
                carb_atual += carb_item
                prot_atual += prot_item
                gord_atual += gord_item
        
        return selecionados

    def _importar_alimento_local(self, food_id: str) -> Dict | None:
        """Importa alimento do FatSecret para base local se não existir."""
        try:
            existente = self.alimento_repo.buscar_por_origem("FatSecret", food_id)
            if existente:
                return {
                    "id_alimento": existente.id_alimento,
                    "nome_alimento": existente.nome_alimento,
                    "porcao_padrao_g": existente.porcao_padrao_g,
                    "calorias": existente.calorias,
                    "carboidratos": existente.carboidratos,
                    "proteinas": existente.proteinas,
                    "gorduras": existente.gorduras,
                }
            
            dados = FatSecretService.importar_alimento(food_id)
            alimento = self.alimento_repo.create(dados)
            return {
                "id_alimento": alimento.id_alimento,
                "nome_alimento": alimento.nome_alimento,
                "porcao_padrao_g": alimento.porcao_padrao_g,
                "calorias": alimento.calorias,
                "carboidratos": alimento.carboidratos,
                "proteinas": alimento.proteinas,
                "gorduras": alimento.gorduras,
            }
        except Exception:
            return None

    def gerar_todas(self, id_usuario: UUID | str) -> List[SugestaoRefeicao]:
        meta = self.meta_repo.get_meta_atual(id_usuario)
        if not meta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Defina suas metas nutricionais antes de gerar sugestões"
            )

        perfil = self.perfil_repo.get_by_usuario(id_usuario)
        objetivo = perfil.objetivo_nutricional if perfil else "manter_peso"
        hoje = date.today().isoformat()

        # Extrai valores numéricos das metas (são floats do SQLAlchemy)
        meta_cal = float(meta.calorias_diarias)
        meta_carb = float(meta.carboidrato_g)
        meta_prot = float(meta.proteina_g)
        meta_gord = float(meta.gordura_g)

        # Remove sugestões antigas do dia
        self.db.query(SugestaoRefeicao).filter(
            SugestaoRefeicao.id_usuario == str(id_usuario),
            SugestaoRefeicao.data_geracao == hoje,
        ).delete()

        sugestoes = []
        
        for tipo, pct in self.REFEICOES_CONFIG:
            # Metas para esta refeição
            alvo_cal = meta_cal * pct
            alvo_carb = meta_carb * pct
            alvo_prot = meta_prot * pct
            alvo_gord = meta_gord * pct

            # Busca alimentos variados no FatSecret para este tipo de refeição
            todos_alimentos = []
            for termo in self.BUSCA_POR_TIPO.get(tipo, []):
                alimentos = self._buscar_alimentos_fatsecret(termo, max_resultados=10)
                todos_alimentos.extend(alimentos)
            
            # Remove duplicatas por food_id
            vistos = set()
            unicos = []
            for a in todos_alimentos:
                fid = a.get("food_id")
                if fid and fid not in vistos:
                    vistos.add(fid)
                    unicos.append(a)
            
            # Filtra por macros compatíveis
            filtrados = self._filtrar_alimentos_por_macros(
                unicos, alvo_cal, alvo_carb, alvo_prot, alvo_gord
            )
            
            # Seleciona melhor combinação
            combinacao = self._selecionar_combinacao_otima(
                filtrados, alvo_cal, alvo_carb, alvo_prot, alvo_gord
            )
            
            # Importa alimentos selecionados para base local
            alimentos_sugeridos = []
            total_cal = total_carb = total_prot = total_gord = 0.0
            
            for item in combinacao:
                local = self._importar_alimento_local(item["food_id"])
                if local:
                    item["id_alimento_local"] = local["id_alimento"]
                alimentos_sugeridos.append(item)
                total_cal += item["calorias_item"]
                total_carb += item["carb_item"]
                total_prot += item["prot_item"]
                total_gord += item["gord_item"]

            # Fallback: se não achou nada, usa hardcoded
            if not alimentos_sugeridos:
                alimentos_sugeridos = [{
                    "nome": f"Sugestão {tipo.lower()} para {objetivo}",
                    "calorias_item": round(alvo_cal),
                    "carb_item": round(alvo_carb),
                    "prot_item": round(alvo_prot),
                    "gord_item": round(alvo_gord),
                }]
                total_cal, total_carb, total_prot, total_gord = alvo_cal, alvo_carb, alvo_prot, alvo_gord

            sugestao = SugestaoRefeicao(
                id_usuario=str(id_usuario),
                nome=f"{tipo} sugerido • {round(total_cal)} kcal",
                descricao=f"Combinação dinâmica baseada no seu objetivo ({objetivo}) via FatSecret",
                tipo_refeicao=tipo,
                calorias=round(total_cal),
                carboidratos=round(total_carb),
                proteinas=round(total_prot),
                gorduras=round(total_gord),
                alimentos_sugeridos=json.dumps(alimentos_sugeridos, ensure_ascii=False),
                aceita=False,
                data_geracao=hoje,
            )
            self.db.add(sugestao)
            sugestoes.append(sugestao)

        self.db.commit()
        return sugestoes

    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 50) -> List[Dict]:
        lista = (
            self.db.query(SugestaoRefeicao)
            .filter(SugestaoRefeicao.id_usuario == str(id_usuario))
            .order_by(SugestaoRefeicao.data_geracao.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [
            {
                "id_sugestao": s.id_sugestao,
                "nome": s.nome,
                "tipo_refeicao": s.tipo_refeicao,
                "calorias": s.calorias,
                "carboidratos": s.carboidratos,
                "proteinas": s.proteinas,
                "gorduras": s.gorduras,
                "aceita": s.aceita,
                "data_geracao": s.data_geracao,
                "alimentos_sugeridos": json.loads(s.alimentos_sugeridos) if s.alimentos_sugeridos else [],
            }
            for s in lista
        ]

    def aceitar(self, id_sugestao: UUID | str) -> Dict:
        sugestao = self.db.query(SugestaoRefeicao).filter(
            SugestaoRefeicao.id_sugestao == str(id_sugestao)
        ).first()
        if not sugestao:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sugestão não encontrada")
        sugestao.aceita = True
        self.db.commit()
        self.db.refresh(sugestao)
        return {
            "id_sugestao": sugestao.id_sugestao,
            "nome": sugestao.nome,
            "tipo_refeicao": sugestao.tipo_refeicao,
            "calorias": sugestao.calorias,
            "carboidratos": sugestao.calorias,
            "proteinas": sugestao.proteinas,
            "gorduras": sugestao.gorduras,
            "aceita": sugestao.aceita,
            "alimentos_sugeridos": json.loads(sugestao.alimentos_sugeridos) if sugestao.alimentos_sugeridos else [],
        }
