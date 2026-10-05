from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.schemas.sugestao import SugestaoAceitaResponse, SugestaoRefeicaoResponse
from app.services.sugestao_service import SugestaoService

router = APIRouter(prefix="/sugestoes", tags=["Sugestões de Refeições"])


def _garantir_dono(usuario: Usuario, id_usuario: UUID) -> str:
    """
    Garante que o usuário autenticado só opere sobre as próprias sugestões.

    Sem esta checagem, qualquer usuário autenticado conseguiria ler, gerar e
    aceitar sugestões de outra pessoa bastando saber o id (IDOR).
    """
    if str(usuario.id_usuario) != str(id_usuario):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode acessar suas próprias sugestões",
        )
    return str(id_usuario)


@router.post("/gerar/{id_usuario}", response_model=list[SugestaoRefeicaoResponse])
def gerar_sugestoes(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    _garantir_dono(usuario, id_usuario)
    return SugestaoService(db).gerar_todas(id_usuario)


@router.get("/{id_usuario}", response_model=list[SugestaoRefeicaoResponse])
def listar_sugestoes(
    id_usuario: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    _garantir_dono(usuario, id_usuario)
    return SugestaoService(db).listar_por_usuario(id_usuario, skip, limit)


@router.post("/aceitar/{id_sugestao}", response_model=SugestaoAceitaResponse)
def aceitar(
    id_sugestao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    """Aceita a sugestão e já cria a refeição no diário."""
    return SugestaoService(db).aceitar(id_sugestao, id_usuario=usuario.id_usuario)
