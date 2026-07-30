from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.usuario_service import UsuarioService
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = UsuarioService(db)
    return service.listar_todos(skip, limit)


@router.get("/{id_usuario}", response_model=UsuarioResponse)
def buscar_usuario(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = UsuarioService(db)
    return service.buscar_por_id(id_usuario)


@router.put("/{id_usuario}", response_model=UsuarioResponse)
def atualizar_usuario(
    id_usuario: UUID,
    dados: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = UsuarioService(db)
    return service.atualizar(id_usuario, dados)


@router.patch("/{id_usuario}/status", response_model=UsuarioResponse)
def desativar_usuario(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = UsuarioService(db)
    service.desativar(id_usuario)
    return service.buscar_por_id(id_usuario)


@router.delete("/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_usuario(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = UsuarioService(db)
    service.deletar(id_usuario)
