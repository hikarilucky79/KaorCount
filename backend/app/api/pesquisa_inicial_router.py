from app.core.idempotencia import RouterIdempotente
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_usuario_atual, garantir_proprio_usuario
from app.models.pesquisa_inicial import PesquisaInicial
from app.models.usuario import Usuario
from app.schemas.pesquisa_inicial import PesquisaInicialResponse, PesquisaInicialUpsert

router = RouterIdempotente(prefix="/pesquisa-inicial", tags=["Pesquisa Inicial"])


@router.put("/{id_usuario}", response_model=PesquisaInicialResponse)
def salvar_pesquisa_inicial(
    id_usuario: UUID,
    dados: PesquisaInicialUpsert,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    garantir_proprio_usuario(usuario, id_usuario)
    pesquisa = db.query(PesquisaInicial).filter(PesquisaInicial.id_usuario == str(id_usuario)).first()
    valores = dados.model_dump()
    if pesquisa:
        for campo, valor in valores.items():
            setattr(pesquisa, campo, valor)
    else:
        pesquisa = PesquisaInicial(id_usuario=str(id_usuario), **valores)
        db.add(pesquisa)
    db.commit()
    db.refresh(pesquisa)
    return pesquisa
