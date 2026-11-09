import bcrypt
from datetime import datetime, timedelta
from uuid import UUID

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


# [F106] Gera o hash seguro da senha para armazenamento.
def hash_senha(senha: str) -> bytes:
    senha_bytes = senha.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha_bytes, salt)


# [F107] Compara uma senha informada com o hash armazenado.
def verificar_senha(senha: str, senha_hash: bytes | str) -> bool:
    try:
        senha_bytes = senha.encode("utf-8")[:72]
        if isinstance(senha_hash, str):
            senha_hash = senha_hash.encode("utf-8")
        return bcrypt.checkpw(senha_bytes, senha_hash)
    except Exception:
        return False


# [F108] Gera o token de autenticação do usuário.
def criar_token_acesso(id_usuario: UUID | str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(id_usuario),
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


TIPO_TOKEN_EMAIL = "email_verificado"


# [F109] Padroniza o endereço de e-mail para comparações e armazenamento.
def normalizar_email(email: str) -> str:
    return email.strip().lower()


# [F110] Cria um token temporário que comprova a verificação do e-mail.
def criar_token_email_verificado(email: str) -> str:
    # Sem "sub": decodificar_token não aceita este token como sessão de usuário.
    payload = {
        "email": normalizar_email(email),
        "tipo": TIPO_TOKEN_EMAIL,
        "exp": datetime.utcnow() + timedelta(minutes=settings.TOKEN_EMAIL_VALIDADE_MINUTOS),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# [F111] Exige um token válido de confirmação de e-mail antes de continuar.
def exigir_email_verificado(email: str, token: str | None) -> None:
    """Recusa o cadastro quando o e-mail não tem um token de verificação válido."""
    if not settings.EXIGIR_VERIFICACAO_EMAIL:
        return
    erro = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Confirme o seu e-mail antes de criar a conta.",
    )
    if not token:
        raise erro
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise erro
    if payload.get("tipo") != TIPO_TOKEN_EMAIL or payload.get("email") != normalizar_email(email):
        raise erro


# [F112] Valida e interpreta os dados do token de autenticação.
def decodificar_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# [F113] Impede que uma conta acesse dados pertencentes a outro usuário.
def garantir_proprio_usuario(usuario: Usuario, id_alvo: UUID | str) -> None:
    """
    Verifica se o recurso pertence ao usuário autenticado (anti-IDOR).
    Lança 403 se o id do path/body não for o do usuário do token.
    """
    if str(usuario.id_usuario) != str(id_alvo):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: você só pode acessar os seus próprios dados",
        )


# [F114] Obtém a conta autenticada a partir do token da requisição.
def get_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    id_usuario = decodificar_token(token)
    if id_usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invÃ¡lidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = UsuarioRepository(db).get_by_id(id_usuario)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invÃ¡lidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if usuario.status_conta != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta inativa",
        )

    return usuario

