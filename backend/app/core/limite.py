from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_usuario_atual
from app.models.limite_requisicao import LimiteRequisicao
from app.models.usuario import Usuario


def ip_do_cliente(request: Request) -> str:
    """
    Quem chega na API é o proxy da Vercel (ou o Caddy), então request.client.host
    é sempre o mesmo e não serve para distinguir visitantes. x-real-ip vem antes
    de x-forwarded-for porque não tem cadeia: o primeiro hop do XFF quem escolhe é
    o próprio cliente quando não há proxy confiável na frente.
    """
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    encaminhados = request.headers.get("x-forwarded-for")
    if encaminhados:
        return encaminhados.split(",")[0].strip()
    return request.client.host if request.client else "desconhecido"


def consumir(db: Session, chave: str, maximo: int, janela_segundos: int) -> tuple[int, int]:
    """
    Registra uma tentativa na janela da chave e devolve (quantidade, restante).
    Janela fixa: a contagem reinicia quando a janela vence. Leitura e escrita na
    mesma transação podem se sobrepor sob concorrência alta e deixar passar uma
    tentativa a mais — aceitável para frear abuso, não para cota paga por usuário.
    """
    agora = datetime.utcnow()
    linha = db.get(LimiteRequisicao, chave)
    if linha is None or (agora - linha.janela_inicio) >= timedelta(seconds=janela_segundos):
        if linha is None:
            linha = LimiteRequisicao(chave=chave)
            db.add(linha)
        linha.janela_inicio = agora
        linha.quantidade = 1
    else:
        linha.quantidade += 1
    db.commit()

    restante = max(maximo - linha.quantidade, 0)
    return linha.quantidade, restante


def _segundos_ate_reiniciar(db: Session, chave: str, janela_segundos: int) -> int:
    linha = db.get(LimiteRequisicao, chave)
    if linha is None:
        return janela_segundos
    decorrido = (datetime.utcnow() - linha.janela_inicio).total_seconds()
    return max(int(janela_segundos - decorrido), 1)


def _rejeitar(retry_after: int) -> None:
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Muitas tentativas. Aguarde antes de tentar de novo.",
        headers={"Retry-After": str(retry_after)},
    )


def limitador_ip(chave_prefixo: str, maximo: int, janela_segundos: int):
    """Dependência: limita por IP de origem."""

    def _dependencia(request: Request, db: Session = Depends(get_db)) -> None:
        chave = f"{chave_prefixo}:{ip_do_cliente(request)}"
        _, restante = consumir(db, chave, maximo, janela_segundos)
        if restante <= 0:
            _rejeitar(_segundos_ate_reiniciar(db, chave, janela_segundos))

    return _dependencia


def limitador_usuario(maximo: int, janela_segundos: int):
    """Dependência: limita por usuário autenticado (precisa do token válido antes)."""

    def _dependencia(
        db: Session = Depends(get_db),
        usuario: Usuario = Depends(get_usuario_atual),
    ) -> None:
        chave = f"usuario:{usuario.id_usuario}"
        _, restante = consumir(db, chave, maximo, janela_segundos)
        if restante <= 0:
            _rejeitar(_segundos_ate_reiniciar(db, chave, janela_segundos))

    return _dependencia


def guarda_cadastro(
    request: Request,
    db: Session = Depends(get_db),
) -> None:
    """
    Cadastro é a única porta escrita por quem não tem conta, então leva dois
    tetos: o de tentativas por IP e o global de contas novas no dia, que limita
    o estrago mesmo com o IP trocado a cada tentativa.
    """
    limite_por_ip = settings.LIMITE_REGISTROS_POR_IP
    janela = settings.LIMITE_JANELA_REGISTRO_SEGUNDOS
    chave = f"registro:{ip_do_cliente(request)}"
    _, restante = consumir(db, chave, limite_por_ip, janela)
    if restante <= 0:
        _rejeitar(_segundos_ate_reiniciar(db, chave, janela))

    teto_diario = settings.LIMITE_CADASTROS_POR_DIA
    if teto_diario > 0:
        desde = datetime.utcnow() - timedelta(days=1)
        novos = db.query(func.count(Usuario.id_usuario)).filter(
            Usuario.data_cadastro >= desde
        ).scalar()
        if novos is not None and novos >= teto_diario:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limite de novos cadastros do dia atingido. Tente mais tarde.",
                headers={"Retry-After": "3600"},
            )
