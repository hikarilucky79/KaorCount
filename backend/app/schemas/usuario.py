from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UsuarioCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(..., min_length=6, max_length=100)


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(None, min_length=2, max_length=100)
    email: EmailStr | None = None
    # status_conta fica de fora de propósito: se fosse aceitável aqui, uma conta
    # desativada se reativaria sozinha no PUT /usuarios/{id}. A única escrita de
    # status permitida ao usuário é o desativar em PATCH /usuarios/{id}/status.


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: UUID
    nome: str
    email: EmailStr
    data_cadastro: datetime
    status_conta: str


class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str
