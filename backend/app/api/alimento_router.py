from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.alimento_service import AlimentoService
from app.schemas.alimento import AlimentoCreate, AlimentoResponse

router = APIRouter(prefix="/alimentos", tags=["Alimentos"])


@router.get("/", response_model=list[AlimentoResponse])
def listar_alimentos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = AlimentoService(db)
    return service.listar_todos(skip, limit)


@router.get("/buscar", response_model=list[AlimentoResponse])
def buscar_alimentos(
    nome: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = AlimentoService(db)
    return service.buscar_por_nome(nome, skip, limit)


@router.get("/{id_alimento}", response_model=AlimentoResponse)
def buscar_alimento(
    id_alimento: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = AlimentoService(db)
    return service.buscar_por_id(id_alimento)


@router.post("/", response_model=AlimentoResponse, status_code=status.HTTP_201_CREATED)
def criar_alimento(
    dados: AlimentoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = AlimentoService(db)
    return service.criar(dados)


# Sem PUT/DELETE: o catálogo é compartilhado entre todos os usuários. Editar ou
# remover uma linha mudaria (ou quebraria, via FK) as refeições já registradas
# por outras pessoas. A única escrita permitida é a inclusão, usada quando o
# alimento ainda não existe na base.
