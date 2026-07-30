from datetime import datetime, timedelta
from uuid import UUID

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def hash_senha(senha: str) -> bytes:
    return pwd_context.hash(senha).encode("utf-8")


def verificar_senha(senha: str, senha_hash: bytes) -> bool:
    return pwd_context.verify(senha, senha_hash.decode("utf-8") if isinstance(senha_hash, bytes) else senha_hash)


def criar_token_acesso(id_usuario: UUID | str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(id_usuario),
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def get_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credenciais_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    id_usuario = decodificar_token(token)
    if id_usuario is None:
        raise credenciais_exception

    repo = UsuarioRepository(db)
    usuario = repo.get_by_id(id_usuario)
    if usuario is None:
        raise credenciais_exception

    if usuario.status_conta != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta inativa",
        )

    return usuario
