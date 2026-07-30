from sqlalchemy.orm import Session

from app.core.security import hash_senha, verificar_senha, criar_token_acesso
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepository
from app.schemas.usuario import UsuarioCreate, UsuarioLogin
from app.schemas.token import Token

from fastapi import HTTPException, status


class AuthService:
    def __init__(self, db: Session):
        self.repo = UsuarioRepository(db)

    def registrar(self, dados: UsuarioCreate) -> Usuario:
        if self.repo.get_by_email(dados.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já cadastrado",
            )
        senha_hash = hash_senha(dados.senha)
        return self.repo.create({
            "nome": dados.nome,
            "email": dados.email,
            "senha_hash": senha_hash,
        })

    def login(self, dados: UsuarioLogin) -> Token:
        usuario = self.repo.get_by_email(dados.email)
        if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if usuario.status_conta != "ativo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conta inativa",
            )
        token = criar_token_acesso(usuario.id_usuario)
        return Token(access_token=token)
