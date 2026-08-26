from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class RegistroAguaCreate(BaseModel):
    id_usuario: UUID
    data_registro: date
    quantidade_ml: float = Field(..., gt=0)


class RegistroAguaUpdate(BaseModel):
    quantidade_ml: float | None = Field(None, gt=0)


class RegistroAguaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_registro_agua: UUID
    id_usuario: UUID
    data_registro: date
    quantidade_ml: float
