from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.registro_agua_service import RegistroAguaService
from app.schemas.registro_agua import RegistroAguaCreate, RegistroAguaUpdate, RegistroAguaResponse

router = APIRouter(prefix="/registro-agua", tags=["Registro de Água"])


@router.get("/usuario/{id_usuario}", response_model=list[RegistroAguaResponse])
def listar_registros(
    id_usuario: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RegistroAguaService(db)
    return service.listar_por_usuario(id_usuario, skip, limit)


@router.get("/usuario/{id_usuario}/total/{data}", response_model=dict)
def total_agua_dia(
    id_usuario: UUID,
    data: date,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RegistroAguaService(db)
    total = service.total_dia(id_usuario, data)
    return {"id_usuario": str(id_usuario), "data": str(data), "total_ml": total}


@router.get("/usuario/{id_usuario}/periodo", response_model=list[RegistroAguaResponse])
def registros_por_periodo(
    id_usuario: UUID,
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RegistroAguaService(db)
    return service.listar_por_periodo(id_usuario, data_inicio, data_fim)


@router.post("/", response_model=RegistroAguaResponse, status_code=status.HTTP_201_CREATED)
def criar_registro(
    dados: RegistroAguaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RegistroAguaService(db)
    return service.criar(dados)


@router.put("/{id_registro}", response_model=RegistroAguaResponse)
def atualizar_registro(
    id_registro: UUID,
    dados: RegistroAguaUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RegistroAguaService(db)
    return service.atualizar(id_registro, dados)


@router.delete("/{id_registro}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_registro(
    id_registro: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RegistroAguaService(db)
    service.deletar(id_registro)
