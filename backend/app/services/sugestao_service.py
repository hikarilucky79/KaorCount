import json
from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.sugestao_refeicao import SugestaoRefeicao
from app.repositories.perfil_nutri_repo import PerfilNutriRepository
from app.repositories.meta_nutri_repo import MetaNutriRepository

from fastapi import HTTPException, status


class SugestaoService:

    REFEICOES_CONFIG = [
        ("Café da manhã", 0.25),
        ("Almoço", 0.35),
        ("Jantar", 0.30),
        ("Lanche", 0.10),
    ]

    SUGESTOES_EXTERNAS = {
        "Café da manhã": [
            "Ovos mexidos com torrada integral + suco natural",
            "Iogurte natural com granola e frutas",
            "Pão integral com queijo branco e café com leite",
            "Vitamina de banana com aveia e whey",
        ],
        "Almoço": [
            "Arroz, feijão, frango grelhado e salada",
            "Macarrão integral com molho de tomate e carne moída",
            "Filé de peixe com legumes e quinoa",
            "Salada completa com atum, ovos e batata doce",
        ],
        "Jantar": [
            "Omelete de claras com legumes",
            "Sopa de frango com legumes",
            "Sanduíche natural de frango com pão integral",
            "Wrap integral com atum e salada",
        ],
        "Lanche": [
            "Banana com pasta de amendoim",
            "Iogurte proteico com castanhas",
            "Barrinha de cereal + whey protein",
            "Mix de frutas secas e castanhas",
        ],
    }

    def __init__(self, db: Session):
        self.db = db
        self.perfil_repo = PerfilNutriRepository(db)
        self.meta_repo = MetaNutriRepository(db)

    def gerar_todas(self, id_usuario: UUID | str) -> list[SugestaoRefeicao]:
        meta = self.meta_repo.get_meta_atual(id_usuario)
        if not meta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Defina suas metas nutricionais antes de gerar sugestões",
            )

        perfil = self.perfil_repo.get_by_usuario(id_usuario)
        objetivo = perfil.objetivo_nutricional if perfil else "manter_peso"
        hoje = date.today().isoformat()

        self.db.query(SugestaoRefeicao).filter(
            SugestaoRefeicao.id_usuario == str(id_usuario),
            SugestaoRefeicao.data_geracao == hoje,
        ).delete()

        sugestoes = []
        for tipo, pct in self.REFEICOES_CONFIG:
            kcal = round(meta.calorias_diarias * pct)
            carb = round(meta.carboidrato_g * pct)
            prot = round(meta.proteina_g * pct)
            gord = round(meta.gordura_g * pct)

            externas = self.SUGESTOES_EXTERNAS.get(tipo, [])

            sugestao = SugestaoRefeicao(
                id_usuario=str(id_usuario),
                nome=f"{tipo} sugerido • {kcal} kcal",
                descricao=externas[0] if externas else f"Sugestão {tipo.lower()} para objetivo {objetivo}",
                tipo_refeicao=tipo,
                calorias=kcal,
                carboidratos=carb,
                proteinas=prot,
                gorduras=gord,
                alimentos_sugeridos=json.dumps(externas, ensure_ascii=False),
                aceita=False,
                data_geracao=hoje,
            )
            self.db.add(sugestao)
            sugestoes.append(sugestao)

        self.db.commit()
        return sugestoes


def aceitar_sugestao(db: Session, id_sugestao: UUID | str) -> dict:
    sugestao = db.query(SugestaoRefeicao).filter(
        SugestaoRefeicao.id_sugestao == str(id_sugestao)
    ).first()
    if not sugestao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sugestão não encontrada")
    sugestao.aceita = True
    db.commit()
    db.refresh(sugestao)

    return {
        "id_sugestao": sugestao.id_sugestao,
        "nome": sugestao.nome,
        "tipo_refeicao": sugestao.tipo_refeicao,
        "calorias": sugestao.calorias,
        "carboidratos": sugestao.carboidratos,
        "proteinas": sugestao.proteinas,
        "gorduras": sugestao.gorduras,
        "aceita": sugestao.aceita,
        "alimentos_sugeridos": json.loads(sugestao.alimentos_sugeridos) if sugestao.alimentos_sugeridos else [],
    }