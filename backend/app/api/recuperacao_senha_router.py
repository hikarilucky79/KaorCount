from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limite import limitador_ip
from app.schemas.usuario import SenhaEsqueciRequest, SenhaRedefinirRequest
from app.services.recuperacao_senha_service import RecuperacaoSenhaService

# APIRouter simples, e não o RouterIdempotente: a rota idempotente desfaz a
# transação em respostas de erro, o que apagaria a contagem de tentativas de um
# código errado. Aqui cada pedido já tem o próprio teto por IP e por e-mail.
router = APIRouter(prefix="/auth/senha", tags=["Recuperação de senha"])

limitar_envio = limitador_ip(
    "senha_esqueci",
    settings.LIMITE_CODIGOS_POR_IP,
    settings.LIMITE_JANELA_CODIGO_SEGUNDOS,
)
limitar_redefinicao = limitador_ip(
    "senha_redefinir",
    settings.LIMITE_CONFIRMACOES_POR_IP,
    settings.LIMITE_JANELA_CONFIRMACAO_SEGUNDOS,
)


@router.post(
    "/esqueci",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(limitar_envio)],
)
# [F046] Solicita um código para iniciar a recuperação de senha.
def esqueci_a_senha(dados: SenhaEsqueciRequest, db: Session = Depends(get_db)):
    # 204 mesmo quando o e-mail não tem conta, para não revelar quem é cliente.
    RecuperacaoSenhaService(db).solicitar_codigo(dados.email)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/redefinir",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(limitar_redefinicao)],
)
# [F047] Valida o código de recuperação e grava a nova senha.
def redefinir_senha(dados: SenhaRedefinirRequest, db: Session = Depends(get_db)):
    RecuperacaoSenhaService(db).redefinir(dados.email, dados.codigo, dados.nova_senha)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
