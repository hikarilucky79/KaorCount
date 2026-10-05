# ───────────────────────────────────────────────────────────────
# backend/app/schemas/sugestao.py
# DTOs de request/response das sugestões de refeições (RF07).
# ───────────────────────────────────────────────────────────────
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AlimentoSugerido(BaseModel):
    """Um alimento dentro de uma sugestão, já com a porção ajustada."""

    id_alimento_local: UUID | None = Field(
        None, description="Id do alimento na base local (para virar item de refeição)"
    )
    food_id: str | None = Field(None, description="Id de origem (FatSecret/TACO)")
    nome: str
    marca: str = ""
    quantidade_g: float = Field(..., gt=0, description="Porção sugerida em gramas")
    calorias: float = Field(0.0, ge=0, description="Calorias da porção sugerida")
    carboidratos: float = Field(0.0, ge=0)
    proteinas: float = Field(0.0, ge=0)
    gorduras: float = Field(0.0, ge=0)


class SugestaoRefeicaoResponse(BaseModel):
    """Sugestão de refeição pronta para exibição no app."""

    model_config = ConfigDict(from_attributes=True)

    id_sugestao: UUID
    id_usuario: UUID
    nome: str
    descricao: str | None = None
    tipo_refeicao: str
    calorias: float
    carboidratos: float
    proteinas: float
    gorduras: float
    aceita: bool
    data_geracao: str
    alimentos_sugeridos: list[AlimentoSugerido] = []


class SugestaoAceitaResponse(BaseModel):
    """Resultado de aceitar uma sugestão: a sugestão + a refeição criada."""

    sugestao: SugestaoRefeicaoResponse
    id_refeicao: UUID | None = Field(
        None, description="Refeição criada no diário (null se o item não pôde ser salvo)"
    )
    itens_criados: int = 0