from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class PerfilNutriCreate(BaseModel):
    id_usuario: UUID
    data_nascimento: date
    genero: str = Field(..., max_length=20)
    objetivo_nutricional: str = Field(..., max_length=50)
    nivel_atividade: str = Field(..., max_length=50)


class PerfilNutriUpdate(BaseModel):
    data_nascimento: date | None = None
    genero: str | None = Field(None, max_length=20)
    objetivo_nutricional: str | None = Field(None, max_length=50)
    nivel_atividade: str | None = Field(None, max_length=50)
    tmb_calculo: float | None = None


class PerfilNutriResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_perfil: UUID
    id_usuario: UUID
    data_nascimento: date
    genero: str
    objetivo_nutricional: str
    nivel_atividade: str
    tmb_calculo: float | None
