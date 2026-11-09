from datetime import datetime
from uuid import UUID
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator

from app.core.senha import validar_forca_senha


class UsuarioCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(..., min_length=8, max_length=100)
    # Emitido por POST /auth/email/confirmar depois que o código enviado ao
    # e-mail é digitado. Obrigatório quando EXIGIR_VERIFICACAO_EMAIL está ligado.
    token_verificacao: str | None = Field(None, max_length=2000)

    # [F161] Valida a força da senha informada no esquema de entrada.
    @model_validator(mode="after")
    def _senha_forte(self) -> "UsuarioCreate":
        problema = validar_forca_senha(self.senha, self.email, self.nome)
        if problema:
            raise ValueError(problema)
        return self


class EmailCodigoRequest(BaseModel):
    email: EmailStr


class EmailConfirmarRequest(BaseModel):
    email: EmailStr
    codigo: str = Field(..., pattern=r"^\d{6}$")


class EmailVerificadoResponse(BaseModel):
    token_verificacao: str


class SenhaEsqueciRequest(BaseModel):
    email: EmailStr


class SenhaRedefinirRequest(BaseModel):
    email: EmailStr
    codigo: str = Field(..., pattern=r"^\d{6}$")
    nova_senha: str = Field(..., min_length=8, max_length=100)

    # [F162] Valida a força da senha informada no esquema de entrada.
    @model_validator(mode="after")
    def _senha_forte(self) -> "SenhaRedefinirRequest":
        problema = validar_forca_senha(self.nova_senha, self.email)
        if problema:
            raise ValueError(problema)
        return self


class PreferenciasUpdate(BaseModel):
    tema: Literal["claro", "escuro", "sistema"] | None = None
    unidade_peso: Literal["kg", "lb"] | None = None
    unidade_altura: Literal["cm", "in"] | None = None
    unidade_agua: Literal["ml", "L", "fl oz"] | None = None
    periodo_grafico: Literal[7, 30] | None = None
    notificacoes_push: bool | None = None


class PreferenciasResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tema: str
    unidade_peso: str
    unidade_altura: str
    unidade_agua: str
    periodo_grafico: int
    notificacoes_push: bool


class UsuarioUpdate(BaseModel):
    preferencias: PreferenciasUpdate | None = None
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
    preferencias: PreferenciasResponse | None = None


class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str
