import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("kaorcount.email")


def smtp_configurado() -> bool:
    return bool(settings.SMTP_HOST and (settings.SMTP_FROM or settings.SMTP_USER))


def _montar_codigo(codigo: str) -> EmailMessage:
    validade = settings.CODIGO_EMAIL_VALIDADE_MINUTOS
    remetente = settings.SMTP_FROM or settings.SMTP_USER
    mensagem = EmailMessage()
    mensagem["Subject"] = f"{codigo} é o seu código do KaorCount"
    mensagem["From"] = formataddr((settings.SMTP_NOME_REMETENTE, remetente))
    mensagem.set_content(
        f"Seu código de verificação do KaorCount é: {codigo}\n\n"
        f"Ele vale por {validade} minutos. Se você não pediu este código, ignore este e-mail."
    )
    mensagem.add_alternative(
        f"""<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px">
<h2 style="margin:0 0 12px">Confirme o seu e-mail</h2>
<p>Use este código para continuar o cadastro no KaorCount:</p>
<p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:16px 0">{codigo}</p>
<p style="color:#666;font-size:13px">Ele vale por {validade} minutos. Se você não pediu este código, ignore este e-mail.</p>
</div>""",
        subtype="html",
    )
    return mensagem


def enviar_codigo_verificacao(destinatario: str, codigo: str) -> None:
    """
    Envia o código por SMTP. Sem SMTP configurado, só o ambiente de desenvolvimento
    segue (o código vai para o log do servidor); em produção a falta de SMTP é um
    erro explícito, e não um cadastro que ninguém consegue concluir.
    """
    if not smtp_configurado():
        if settings.is_production:
            logger.error("SMTP_HOST/SMTP_FROM não configurados: não é possível enviar o código.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Não foi possível enviar o e-mail de verificação agora. Tente mais tarde.",
            )
        logger.warning("SMTP não configurado. Código de verificação de %s: %s", destinatario, codigo)
        return

    mensagem = _montar_codigo(codigo)
    mensagem["To"] = destinatario
    try:
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(
                settings.SMTP_HOST, settings.SMTP_PORT, timeout=10, context=ssl.create_default_context()
            ) as servidor:
                _entregar(servidor, mensagem)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as servidor:
                servidor.starttls(context=ssl.create_default_context())
                _entregar(servidor, mensagem)
    except (smtplib.SMTPException, OSError) as erro:
        logger.error("Falha ao enviar e-mail de verificação: %s", erro)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível enviar o e-mail de verificação agora. Tente mais tarde.",
        ) from erro


def _entregar(servidor: smtplib.SMTP, mensagem: EmailMessage) -> None:
    if settings.SMTP_USER:
        servidor.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    servidor.send_message(mensagem)
