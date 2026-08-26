from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.perfil_nutri_service import PerfilNutriService
from app.schemas.perfil_nutri import PerfilNutriCreate, PerfilNutriUpdate, PerfilNutriResponse

router = APIRouter(prefix="/perfil-nutri", tags=["Perfil Nutricional"])


@router.get("/{id_usuario}", response_model=PerfilNutriResponse)
def buscar_perfil(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = PerfilNutriService(db)
    return service.buscar_por_usuario(id_usuario)


@router.post("/", response_model=PerfilNutriResponse, status_code=status.HTTP_201_CREATED)
def criar_perfil(
    dados: PerfilNutriCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = PerfilNutriService(db)
    return service.criar(dados)


@router.put("/{id_usuario}", response_model=PerfilNutriResponse)
def atualizar_perfil(
    id_usuario: UUID,
    dados: PerfilNutriUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = PerfilNutriService(db)
    return service.atualizar(id_usuario, dados)


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_perfil(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = PerfilNutriService(db)
    service.deletar(id_usuario)
