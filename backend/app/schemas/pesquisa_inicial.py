from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PesquisaInicialUpsert(BaseModel):
    origem_app: str = Field(..., min_length=1, max_length=50)
    ja_contou_calorias: bool
    peso_objetivo_kg: float = Field(..., ge=20, le=350)


class PesquisaInicialResponse(PesquisaInicialUpsert):
    model_config = ConfigDict(from_attributes=True)

    id_pesquisa: UUID
    id_usuario: UUID
