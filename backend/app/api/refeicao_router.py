from app.core.idempotencia import RouterIdempotente
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual, garantir_proprio_usuario
from app.models.usuario import Usuario
from app.services.refeicao_service import RefeicaoService
from app.schemas.refeicao import RefeicaoCreate, RefeicaoUpdate, RefeicaoResponse
from app.schemas.item_refeicao import ItemRefeicaoCreate, ItemRefeicaoUpdate, ItemRefeicaoResponse

router = RouterIdempotente(prefix="/refeicoes", tags=["Refeições"])


# [F048] Lista as refeições do usuário.
@router.get("/usuario/{id_usuario}", response_model=list[RefeicaoResponse])
def listar_refeicoes(
    id_usuario: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    garantir_proprio_usuario(usuario, id_usuario)
    service = RefeicaoService(db)
    return service.listar_por_usuario(id_usuario, skip, limit)


# [F049] Lista refeições dentro do intervalo informado.
@router.get("/usuario/{id_usuario}/periodo", response_model=list[RefeicaoResponse])
def refeicoes_por_periodo(
    id_usuario: UUID,
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    garantir_proprio_usuario(usuario, id_usuario)
    service = RefeicaoService(db)
    return service.listar_por_periodo(id_usuario, data_inicio, data_fim)


# [F050] Lista refeições registradas em uma data.
@router.get("/usuario/{id_usuario}/dia/{data}", response_model=list[RefeicaoResponse])
def refeicoes_por_dia(
    id_usuario: UUID,
    data: date,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    garantir_proprio_usuario(usuario, id_usuario)
    service = RefeicaoService(db)
    return service.listar_por_dia(id_usuario, data)


# [F051] Calcula o total diário de calorias e macronutrientes.
@router.get("/usuario/{id_usuario}/dia/{data}/macros", response_model=dict)
def resumo_macros_dia(
    id_usuario: UUID,
    data: date,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    garantir_proprio_usuario(usuario, id_usuario)
    service = RefeicaoService(db)
    macros = service.resumo_macros_dia(id_usuario, data)
    return {"id_usuario": str(id_usuario), "data": str(data), "macros": macros}


# [F052] Busca uma refeição pelo identificador.
@router.get("/{id_refeicao}", response_model=RefeicaoResponse)
def buscar_refeicao(
    id_refeicao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    refeicao = service.buscar_por_id(id_refeicao)
    garantir_proprio_usuario(usuario, refeicao.id_usuario)
    return refeicao


# [F053] Registra uma nova refeição.
@router.post("/", response_model=RefeicaoResponse, status_code=status.HTTP_201_CREATED)
def criar_refeicao(
    dados: RefeicaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    garantir_proprio_usuario(usuario, dados.id_usuario)
    service = RefeicaoService(db)
    return service.criar(dados)


# [F054] Atualiza os dados de uma refeição existente.
@router.put("/{id_refeicao}", response_model=RefeicaoResponse)
def atualizar_refeicao(
    id_refeicao: UUID,
    dados: RefeicaoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    garantir_proprio_usuario(usuario, service.buscar_por_id(id_refeicao).id_usuario)
    return service.atualizar(id_refeicao, dados)


# [F055] Remove uma refeição registrada.
@router.delete("/{id_refeicao}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_refeicao(
    id_refeicao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    garantir_proprio_usuario(usuario, service.buscar_por_id(id_refeicao).id_usuario)
    service.deletar(id_refeicao)


# [F056] Lista os alimentos associados a uma refeição.
@router.get("/{id_refeicao}/itens", response_model=list[ItemRefeicaoResponse])
def listar_itens(
    id_refeicao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    garantir_proprio_usuario(usuario, service.buscar_por_id(id_refeicao).id_usuario)
    return service.listar_itens(id_refeicao)


# [F057] Adiciona um alimento à refeição.
@router.post("/{id_refeicao}/itens", response_model=ItemRefeicaoResponse, status_code=status.HTTP_201_CREATED)
def adicionar_item(
    id_refeicao: UUID,
    dados: ItemRefeicaoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    dados.id_refeicao = id_refeicao
    service = RefeicaoService(db)
    garantir_proprio_usuario(usuario, service.buscar_por_id(id_refeicao).id_usuario)
    return service.adicionar_item(dados)


# [F058] Atualiza a quantidade ou os dados de um alimento da refeição.
@router.put("/itens/{id_item}", response_model=ItemRefeicaoResponse)
def atualizar_item(
    id_item: UUID,
    dados: ItemRefeicaoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    item = service.item_repo.get_by_id(id_item)
    if item:
        refeicao = service.buscar_por_id(item.id_refeicao)
        garantir_proprio_usuario(usuario, refeicao.id_usuario)
    return service.atualizar_item(id_item, dados)


# [F059] Remove um alimento da refeição.
@router.delete("/itens/{id_item}", status_code=status.HTTP_204_NO_CONTENT)
def remover_item(
    id_item: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = RefeicaoService(db)
    item = service.item_repo.get_by_id(id_item)
    if item:
        refeicao = service.buscar_por_id(item.id_refeicao)
        garantir_proprio_usuario(usuario, refeicao.id_usuario)
    service.remover_item(id_item)
