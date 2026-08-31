from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.fatsecret_service import FatSecretService
from app.services.alimento_service import AlimentoService
from app.schemas.alimento import AlimentoCreate, AlimentoResponse

router = APIRouter(prefix="/fatsecret", tags=["FatSecret - Base externa de alimentos"])


@router.get("/buscar")
def buscar_alimentos(
    nome: str = Query("", min_length=0),
    pagina: int = Query(0, ge=0),
    max_resultados: int = Query(25, ge=1, le=50),
    categoria: str | None = Query(None),
    somente_brasil: bool = Query(False),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return FatSecretService.buscar_alimentos(nome, pagina, max_resultados, categoria, somente_brasil)


@router.get("/alimento/{food_id}")
def detalhes_alimento(
    food_id: str,
    usuario: Usuario = Depends(get_usuario_atual),
):
    return FatSecretService.buscar_alimento_por_id(food_id)


@router.post("/importar/{food_id}", response_model=AlimentoResponse, status_code=status.HTTP_201_CREATED)
def importar_alimento(
    food_id: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    dados_import = FatSecretService.importar_alimento(food_id)
    service = AlimentoService(db)
    if service.buscar_por_nome(dados_import["nome_alimento"], limit=1):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Alimento já cadastrado na base local")
    return service.criar(AlimentoCreate(**dados_import))
