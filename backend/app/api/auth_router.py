from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.auth_service import AuthService
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioResponse
from app.schemas.token import Token

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registrar", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar(dados: UsuarioCreate, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.registrar(dados)


@router.post("/login", response_model=Token)
def login(dados: UsuarioLogin, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(dados)


@router.get("/me", response_model=UsuarioResponse)
def perfil_atual(usuario: Usuario = Depends(get_usuario_atual)):
    return usuario
