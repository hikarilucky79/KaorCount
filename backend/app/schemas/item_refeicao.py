from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.alimento import AlimentoResponse


class ItemRefeicaoCreate(BaseModel):
    id_refeicao: UUID | None = None
    id_alimento: UUID
    quantidade_alimento_g: float = Field(..., gt=0)


class ItemRefeicaoUpdate(BaseModel):
    quantidade_alimento_g: float | None = Field(None, gt=0)


class ItemRefeicaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_refeicao_item: UUID
    id_refeicao: UUID
    id_alimento: UUID
    quantidade_alimento_g: float
    alimento: AlimentoResponse | None = None
