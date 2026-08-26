from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.refeicao_service import RefeicaoService
from app.schemas.refeicao import RefeicaoCreate, RefeicaoUpdate, RefeicaoResponse
from app.schemas.item_refeicao import ItemRefeicaoCreate, ItemRefeicaoUpdate, ItemRefeicaoResponse

router = APIRouter(prefix="/refeicoes", tags=["Refeições"])


@router.get("/usuario/{id_usuario}", response_model=list[RefeicaoResponse])
def listar_refeicoes(
    id_usuario: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.listar_por_usuario(id_usuario, skip, limit)


@router.get("/usuario/{id_usuario}/periodo", response_model=list[RefeicaoResponse])
def refeicoes_por_periodo(
    id_usuario: UUID,
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.listar_por_periodo(id_usuario, data_inicio, data_fim)


@router.get("/usuario/{id_usuario}/dia/{data}", response_model=list[RefeicaoResponse])
def refeicoes_por_dia(
    id_usuario: UUID,
    data: date,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.listar_por_dia(id_usuario, data)


@router.get("/usuario/{id_usuario}/dia/{data}/macros", response_model=dict)
def resumo_macros_dia(
    id_usuario: UUID,
    data: date,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    macros = service.resumo_macros_dia(id_usuario, data)
    return {"id_usuario": str(id_usuario), "data": str(data), "macros": macros}


@router.get("/{id_refeicao}", response_model=RefeicaoResponse)
def buscar_refeicao(
    id_refeicao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.buscar_por_id(id_refeicao)


@router.post("/", response_model=RefeicaoResponse, status_code=status.HTTP_201_CREATED)
def criar_refeicao(
    dados: RefeicaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.criar(dados)


@router.put("/{id_refeicao}", response_model=RefeicaoResponse)
def atualizar_refeicao(
    id_refeicao: UUID,
    dados: RefeicaoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.atualizar(id_refeicao, dados)


@router.delete("/{id_refeicao}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_refeicao(
    id_refeicao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    service.deletar(id_refeicao)


@router.get("/{id_refeicao}/itens", response_model=list[ItemRefeicaoResponse])
def listar_itens(
    id_refeicao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.listar_itens(id_refeicao)


@router.post("/{id_refeicao}/itens", response_model=ItemRefeicaoResponse, status_code=status.HTTP_201_CREATED)
def adicionar_item(
    id_refeicao: UUID,
    dados: ItemRefeicaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    dados.id_refeicao = id_refeicao
    service = RefeicaoService(db)
    return service.adicionar_item(dados)


@router.put("/itens/{id_item}", response_model=ItemRefeicaoResponse)
def atualizar_item(
    id_item: UUID,
    dados: ItemRefeicaoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    return service.atualizar_item(id_item, dados)


@router.delete("/itens/{id_item}", status_code=status.HTTP_204_NO_CONTENT)
def remover_item(
    id_item: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    service.remover_item(id_item)
