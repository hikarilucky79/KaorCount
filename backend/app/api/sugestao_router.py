from datetime import date
from app.core.idempotencia import RouterIdempotente
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limite import limitador_usuario, consumir, _segundos_ate_reiniciar
from app.core.security import get_usuario_atual
from app.models.usuario import Usuario
from app.models.alimento import Alimento
from app.schemas.sugestao import SugestaoAceitaResponse, SugestaoRefeicaoResponse
from app.services.sugestao_service import SugestaoService

router = RouterIdempotente(prefix="/sugestoes", tags=["Sugestões de Refeições"])

# gerar_todas() bate no FatSecret várias vezes numa só chamada; sem teto, um
# script com um token bastava para esvaziar a cota do dia.
limitar_geracao = limitador_usuario(
    settings.LIMITE_SUGESTOES_POR_USUARIO,
    settings.LIMITE_JANELA_SUGESTAO_SEGUNDOS,
)


# [F068] Limita a frequência de geração de sugestões por fonte de dados.
def limitar_geracao_por_fonte(db: Session = Depends(get_db), usuario: Usuario = Depends(get_usuario_atual)) -> None:
    possui_catalogo = db.query(Alimento.id_alimento).filter(Alimento.porcao_padrao_g > 0, Alimento.calorias > 0).first()
    if not possui_catalogo:
        return limitar_geracao(db=db, usuario=usuario)
    chave = f"sugestoes_local:{usuario.id_usuario}"
    _, restante = consumir(db, chave, 10, 60)
    if restante <= 0:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde antes de tentar de novo.",
                            headers={"Retry-After": str(_segundos_ate_reiniciar(db, chave, 60))})


# [F069] Confere se o recurso pertence ao usuário autenticado.
def _garantir_dono(usuario: Usuario, id_usuario: UUID) -> str:
    """
    Garante que o usuário autenticado só opere sobre as próprias sugestões.

    Sem esta checagem, qualquer usuário autenticado conseguiria ler, gerar e
    aceitar sugestões de outra pessoa bastando saber o id (IDOR).
    """
    if str(usuario.id_usuario) != str(id_usuario):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode acessar suas próprias sugestões",
        )
    return str(id_usuario)


@router.post(
    "/gerar/{id_usuario}",
    response_model=list[SugestaoRefeicaoResponse],
    dependencies=[Depends(limitar_geracao_por_fonte)],
)
# [F070] Gera sugestões de refeições com base nas metas e preferências do usuário.
def gerar_sugestoes(
    id_usuario: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    _garantir_dono(usuario, id_usuario)
    return SugestaoService(db).gerar_todas(id_usuario)


# [F071] Lista sugestões de refeição já geradas para o usuário.
@router.get("/{id_usuario}", response_model=list[SugestaoRefeicaoResponse])
def listar_sugestoes(
    id_usuario: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    _garantir_dono(usuario, id_usuario)
    return SugestaoService(db).listar_por_usuario(id_usuario, skip, limit)


# [F072] Confirma uma sugestão e registra a refeição correspondente.
@router.post("/aceitar/{id_sugestao}", response_model=SugestaoAceitaResponse)
def aceitar(
    id_sugestao: UUID,
    data: date | None = Query(None),
    desfazer: bool = Query(False),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    """Aceita a sugestão e já cria a refeição no diário."""
    service = SugestaoService(db)
    if desfazer:
        return service.desfazer(id_sugestao, id_usuario=usuario.id_usuario, dia=data)
    return service.aceitar(id_sugestao, id_usuario=usuario.id_usuario, data_refeicao=data)
