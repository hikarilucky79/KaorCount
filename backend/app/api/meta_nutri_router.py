from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.meta_nutri_service import MetaNutriService
from app.schemas.meta_nutri import MetaNutriCreate, MetaNutriUpdate, MetaNutriResponse

router = APIRouter(prefix="/metas-nutri", tags=["Metas Nutricionais"])


@router.get("/usuario/{id_usuario}", response_model=list[MetaNutriResponse])
def listar_metas_por_usuario(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = MetaNutriService(db)
    return service.listar_por_usuario(id_usuario)


@router.get("/usuario/{id_usuario}/atual", response_model=MetaNutriResponse)
def meta_atual(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = MetaNutriService(db)
    return service.meta_atual(id_usuario)


@router.get("/{id_meta}", response_model=MetaNutriResponse)
def buscar_meta(
    id_meta: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = MetaNutriService(db)
    return service.buscar_por_id(id_meta)


@router.post("/", response_model=MetaNutriResponse, status_code=status.HTTP_201_CREATED)
def criar_meta(
    dados: MetaNutriCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = MetaNutriService(db)
    return service.criar(dados)


@router.put("/{id_meta}", response_model=MetaNutriResponse)
def atualizar_meta(
    id_meta: UUID,
    dados: MetaNutriUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = MetaNutriService(db)
    return service.atualizar(id_meta, dados)


@router.delete("/{id_meta}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_meta(
    id_meta: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = MetaNutriService(db)
    service.deletar(id_meta)
