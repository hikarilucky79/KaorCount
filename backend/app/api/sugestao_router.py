from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.services.sugestao_service import SugestaoService
from app.services.sugestao_service import aceitar_sugestao

router = APIRouter(prefix="/sugestoes", tags=["Sugestões de Refeições"])


@router.post("/gerar/{id_usuario}")
def gerar_sugestoes(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    service = SugestaoService(db)
    return service.gerar_todas(id_usuario)


@router.get("/{id_usuario}")
def listar_sugestoes(
    id_usuario: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    from app.models.sugestao_refeicao import SugestaoRefeicao
    lista = db.query(SugestaoRefeicao).filter(
        SugestaoRefeicao.id_usuario == str(id_usuario)
    ).order_by(SugestaoRefeicao.data_geracao.desc()).offset(skip).limit(limit).all()
    return [
        {"id_sugestao": s.id_sugestao, "nome": s.nome, "tipo_refeicao": s.tipo_refeicao,
         "calorias": s.calorias, "carboidratos": s.carboidratos, "proteinas": s.proteinas,
         "gorduras": s.gorduras, "aceita": s.aceita, "data_geracao": s.data_geracao}
        for s in lista
    ]


@router.post("/aceitar/{id_sugestao}")
def aceitar(
    id_sugestao: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return aceitar_sugestao(db, id_sugestao)