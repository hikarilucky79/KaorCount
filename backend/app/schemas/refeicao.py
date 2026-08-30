from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict
from app.schemas.item_refeicao import ItemRefeicaoResponse


class RefeicaoCreate(BaseModel):
    id_usuario: UUID
    data_refeicao: date
    tipo_refeicao: str = Field(..., max_length=50)


class RefeicaoUpdate(BaseModel):
    data_refeicao: date | None = None
    tipo_refeicao: str | None = Field(None, max_length=50)


class RefeicaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_refeicao: UUID
    id_usuario: UUID
    data_refeicao: date
    tipo_refeicao: str
    itens: list[ItemRefeicaoResponse] = []
