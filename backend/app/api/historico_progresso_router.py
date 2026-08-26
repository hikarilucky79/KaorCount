from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.historico_progresso_service import HistoricoProgressoService
from app.schemas.historico_progresso import HistoricoProgressoCreate, HistoricoProgressoUpdate, HistoricoProgressoResponse

router = APIRouter(prefix="/historico-progresso", tags=["Histórico de Progresso"])


@router.get("/usuario/{id_usuario}", response_model=list[HistoricoProgressoResponse])
def listar_historico(
    id_usuario: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = HistoricoProgressoService(db)
    return service.listar_por_usuario(id_usuario, skip, limit)


@router.get("/usuario/{id_usuario}/periodo", response_model=list[HistoricoProgressoResponse])
def historico_por_periodo(
    id_usuario: UUID,
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = HistoricoProgressoService(db)
    return service.listar_por_periodo(id_usuario, data_inicio, data_fim)


@router.get("/{id_progresso}", response_model=HistoricoProgressoResponse)
def buscar_historico(
    id_progresso: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = HistoricoProgressoService(db)
    return service.buscar_por_id(id_progresso)


@router.post("/", response_model=HistoricoProgressoResponse, status_code=status.HTTP_201_CREATED)
def criar_historico(
    dados: HistoricoProgressoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = HistoricoProgressoService(db)
    return service.criar(dados)


@router.put("/{id_progresso}", response_model=HistoricoProgressoResponse)
def atualizar_historico(
    id_progresso: UUID,
    dados: HistoricoProgressoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = HistoricoProgressoService(db)
    return service.atualizar(id_progresso, dados)


@router.delete("/{id_progresso}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_historico(
    id_progresso: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = HistoricoProgressoService(db)
    service.deletar(id_progresso)
