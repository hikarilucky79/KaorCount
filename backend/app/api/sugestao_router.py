from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.sugestao_service import SugestaoService

router = APIRouter(prefix="/sugestoes", tags=["Sugestões de Refeições"])


@router.post("/gerar/{id_usuario}")
def gerar_sugestoes(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return SugestaoService(db).gerar_todas(id_usuario)


@router.get("/{id_usuario}")
def listar_sugestoes(
    id_usuario: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return SugestaoService(db).listar_por_usuario(id_usuario, skip, limit)


@router.post("/aceitar/{id_sugestao}")
def aceitar(
    id_sugestao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return SugestaoService(db).aceitar(id_sugestao)
