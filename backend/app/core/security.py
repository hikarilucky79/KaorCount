import bcrypt
import json
import os
import time
import urllib.request
from datetime import datetime, timedelta
from uuid import UUID

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def hash_senha(senha: str) -> bytes:
    senha_bytes = senha.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha_bytes, salt)


def verificar_senha(senha: str, senha_hash: bytes | str) -> bool:
    try:
        senha_bytes = senha.encode("utf-8")[:72]
        if isinstance(senha_hash, str):
            senha_hash = senha_hash.encode("utf-8")
        return bcrypt.checkpw(senha_bytes, senha_hash)
    except Exception:
        return False


# ─── Auth0: verificação de Access Tokens RS256 via JWKS ─────────────────
# Estratégia híbrida: o Auth0 emite e valida a identidade; o acesso continua
# stateless no backend (validação de assinatura contra o JWKS público).

_JWKS_CACHE = {"url": None, "jwks": None, "valido_ate": 0.0}
JWKS_TTL_SEGUNDOS = 3600


def _auth0_issuer() -> str:
    return f"https://{settings.AUTH0_DOMAIN}/"


def _auth0_jwks_url() -> str:
    return f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"


def carregar_jwks_auth0() -> list[dict] | None:
    """Busca e cacheia o JWKS público do Auth0. None se Auth0 não configurado."""
    if not settings.AUTH0_DOMAIN:
        return None
    agora = time.time()
    if _JWKS_CACHE["url"] == _auth0_jwks_url() and _JWKS_CACHE["valido_ate"] > agora:
        return _JWKS_CACHE["jwks"]
    try:
        with urllib.request.urlopen(_auth0_jwks_url(), timeout=10) as resp:
            chaves = json.loads(resp.read().decode("utf-8")).get("keys", [])
    except Exception:
        return None
    _JWKS_CACHE.update(url=_auth0_jwks_url(), jwks=chaves, valido_ate=agora + JWKS_TTL_SEGUNDOS)
    return chaves


def _chave_por_kid(jwks: list[dict], kid: str | None) -> dict | None:
    for jwk in jwks:
        if jwk.get("kid") == kid:
            return jwk
    return None


def decodificar_token_auth0(token: str, jwks: list[dict] | None = None) -> dict | None:
    """Valida um Access Token do Auth0 (RS256). Retorna o payload em caso de sucesso.

    ``jwks`` permite injetar o conjunto de chaves (testes), sem chamada de rede.
    """
    if not settings.AUTH0_DOMAIN:
        return None
    try:
        header = jwt.get_unverified_header(token)
        chaves = jwks if jwks is not None else carregar_jwks_auth0()
        if not chaves:
            return None
        chave = _chave_por_kid(chaves, header.get("kid"))
        if chave is None:
            return None
        kwargs = {"algorithms": ["RS256"], "issuer": _auth0_issuer()}
        if settings.AUTH0_AUDIENCE:
            kwargs["audience"] = settings.AUTH0_AUDIENCE
        return jwt.decode(token, chave, **kwargs)
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Nunca derruba a autenticação: token inválido apenas cai para o
        # fluxo legado ou é rejeitado com 401 (e nunca 500).
        return None


def criar_usuario_auth0(db: Session, payload: dict) -> Usuario:
    """JIT provisioning: cria o usuário local vinculado ao ``sub`` do Auth0.

    Se o e-mail já existir (usuário legado migrando), apenas vincula o ``sub``,
    sem duplicar o registro. Usuários Auth0 usam placeholder de senha (a
    autenticação local não é usada para eles).
    """
    repo = UsuarioRepository(db)
    sub = payload["sub"]
    email = payload.get("email")
    novo = Usuario(
        nome=(payload.get("name") or payload.get("nickname") or "Usuário"),
        email=email,
        senha_hash=hash_senha(os.urandom(32).hex()),
        auth0_sub=str(sub),
        auth0_email_verified=bool(payload.get("email_verified", False)),
    )
    try:
        db.add(novo)
        db.commit()
        db.refresh(novo)
        return novo
    except IntegrityError:
        db.rollback()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Não foi possível vincular a conta sem e-mail",
            )
        usuario = repo.get_by_email(email)
        if usuario is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Não foi possível vincular a conta",
            )
        usuario.auth0_sub = str(sub)
        usuario.auth0_email_verified = bool(payload.get("email_verified", False))
        db.commit()
        db.refresh(usuario)
        return usuario


# ─── Legado (HS256 local) ───────────────────────────────────────────────


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

    repo = UsuarioRepository(db)

    # 1) Auth0 (se configurado e o token for RS256/Auth0).
    payload_auth0 = decodificar_token_auth0(token)
    if payload_auth0:
        usuario = repo.get_by_auth0_sub(payload_auth0.get("sub"))
        if usuario is None:
            usuario = criar_usuario_auth0(db, payload_auth0)
        if usuario.status_conta != "ativo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conta inativa",
            )
        return usuario

    # 2) Legado (HS256 emitido pelo próprio backend).
    id_usuario = decodificar_token(token)
    if id_usuario is None:
        raise credenciais_exception

    usuario = repo.get_by_id(id_usuario)
    if usuario is None:
        raise credenciais_exception

    if usuario.status_conta != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta inativa",
        )

    return usuario