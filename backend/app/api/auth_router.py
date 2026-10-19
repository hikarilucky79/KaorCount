from app.core.idempotencia import RouterIdempotente
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limite import guarda_cadastro, limitador_ip
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.auth_service import AuthService
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
)
from app.schemas.token import Token
from app.schemas.quiz import CadastroComQuiz
from app.services.quiz_service import QuizService
from app.services.usuario_service import UsuarioService

router = RouterIdempotente(prefix="/auth", tags=["Autenticação"])

# O login é o alvo óbvio de força bruta: sem teto por IP, uma lista de senhas
# vazadas roda contra a API até achar uma conta.
limitar_login = limitador_ip(
    "login",
    settings.LIMITE_LOGINS_POR_IP,
    settings.LIMITE_JANELA_LOGIN_SEGUNDOS,
)


@router.post(
    "/registrar",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(guarda_cadastro)],
)
def registrar(dados: UsuarioCreate, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.registrar(dados)


@router.post("/login", response_model=Token, dependencies=[Depends(limitar_login)])
def login(dados: UsuarioLogin, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(dados)


@router.post("/registrar-com-quiz", response_model=UsuarioResponse, status_code=201, dependencies=[Depends(guarda_cadastro)])
def registrar_com_quiz(
    dados: CadastroComQuiz,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: Session = Depends(get_db),
):
    usuario = UsuarioService(db).criar(dados.cadastro)
    QuizService(db).salvar(usuario.id_usuario, dados.quiz)
    return usuario


@router.get("/me", response_model=UsuarioResponse)
def perfil_atual(usuario: Usuario = Depends(get_usuario_atual)):
    return usuario
