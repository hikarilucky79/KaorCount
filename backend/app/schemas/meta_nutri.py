from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class MetaNutriCreate(BaseModel):
    id_usuario: UUID
    calorias_diarias: float = Field(..., gt=0)
    carboidrato_g: float = Field(..., gt=0)
    proteina_g: float = Field(..., gt=0)
    gordura_g: float = Field(..., gt=0)
    data_inicio: date


class MetaNutriUpdate(BaseModel):
    calorias_diarias: float | None = Field(None, gt=0)
    carboidrato_g: float | None = Field(None, gt=0)
    proteina_g: float | None = Field(None, gt=0)
    gordura_g: float | None = Field(None, gt=0)
    data_inicio: date | None = None


class MetaNutriResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_meta: UUID
    id_usuario: UUID
    calorias_diarias: float
    carboidrato_g: float
    proteina_g: float
    gordura_g: float
    data_inicio: date
