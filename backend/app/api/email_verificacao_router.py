from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limite import limitador_ip
from app.schemas.usuario import EmailCodigoRequest, EmailConfirmarRequest, EmailVerificadoResponse
from app.services.verificacao_email_service import VerificacaoEmailService

# APIRouter simples, e não o RouterIdempotente: a rota idempotente desfaz a
# transação em respostas de erro, o que apagaria a contagem de tentativas de um
# código errado. Aqui cada pedido já tem o próprio teto por IP e por e-mail.
router = APIRouter(prefix="/auth/email", tags=["Verificação de e-mail"])

limitar_envio = limitador_ip(
    "email_codigo",
    settings.LIMITE_CODIGOS_POR_IP,
    settings.LIMITE_JANELA_CODIGO_SEGUNDOS,
)
limitar_confirmacao = limitador_ip(
    "email_confirmar",
    settings.LIMITE_CONFIRMACOES_POR_IP,
    settings.LIMITE_JANELA_CONFIRMACAO_SEGUNDOS,
)


@router.post(
    "/enviar-codigo",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(limitar_envio)],
)
def enviar_codigo(dados: EmailCodigoRequest, db: Session = Depends(get_db)):
    VerificacaoEmailService(db).enviar_codigo(dados.email)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/confirmar",
    response_model=EmailVerificadoResponse,
    dependencies=[Depends(limitar_confirmacao)],
)
def confirmar_codigo(dados: EmailConfirmarRequest, db: Session = Depends(get_db)):
    token = VerificacaoEmailService(db).confirmar_codigo(dados.email, dados.codigo)
    return EmailVerificadoResponse(token_verificacao=token)
