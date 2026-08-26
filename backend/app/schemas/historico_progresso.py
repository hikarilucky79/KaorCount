from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class HistoricoProgressoCreate(BaseModel):
    id_usuario: UUID
    data_registro: date
    peso_atual: float = Field(..., gt=0)
    altura_atual: float = Field(..., gt=0)


class HistoricoProgressoUpdate(BaseModel):
    peso_atual: float | None = Field(None, gt=0)
    altura_atual: float | None = Field(None, gt=0)


class HistoricoProgressoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_progresso: UUID
    id_usuario: UUID
    data_registro: date
    peso_atual: float
    altura_atual: float
