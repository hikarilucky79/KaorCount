from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class AlimentoCreate(BaseModel):
    nome_alimento: str = Field(..., min_length=2, max_length=150)
    porcao_padrao_g: float = Field(100.0, gt=0)
    calorias: float = Field(..., ge=0)
    carboidratos: float = Field(..., ge=0)
    proteinas: float = Field(..., ge=0)
    gorduras: float = Field(..., ge=0)
    origem_dados: str | None = Field(None, max_length=100)


class AlimentoUpdate(BaseModel):
    nome_alimento: str | None = Field(None, min_length=2, max_length=150)
    porcao_padrao_g: float | None = Field(None, gt=0)
    calorias: float | None = Field(None, ge=0)
    carboidratos: float | None = Field(None, ge=0)
    proteinas: float | None = Field(None, ge=0)
    gorduras: float | None = Field(None, ge=0)
    origem_dados: str | None = Field(None, max_length=100)


class AlimentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_alimento: UUID
    nome_alimento: str
    porcao_padrao_g: float
    calorias: float
    carboidratos: float
    proteinas: float
    gorduras: float
    origem_dados: str | None
