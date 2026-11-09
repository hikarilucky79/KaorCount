import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger("kaorcount.email")

RESEND_URL = "https://api.resend.com/emails"
RESEND_TIMEOUT_SEGUNDOS = 10


# [F187] Verifica se as credenciais necessárias para envio pelo Resend estão configuradas.
def resend_configurado() -> bool:
    return bool(settings.RESEND_API_KEY and settings.RESEND_FROM)


# [F188] Verifica se os parâmetros de conexão SMTP estão configurados.
def smtp_configurado() -> bool:
    return bool(settings.SMTP_HOST and (settings.SMTP_FROM or settings.SMTP_USER))


# [F189] Verifica se há algum serviço de envio de e-mail disponível.
def email_configurado() -> bool:
    return resend_configurado() or smtp_configurado()


# [F190] Monta o conteúdo da mensagem de e-mail que contém o código.
def _corpo_codigo(titulo: str, intro: str, codigo: str) -> tuple[str, str]:
    validade = settings.CODIGO_EMAIL_VALIDADE_MINUTOS
    aviso = f"Ele vale por {validade} minutos. Se você não pediu este código, ignore este e-mail."
    texto = f"{intro}\n\nSeu código é: {codigo}\n\n{aviso}"
    html = f"""<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px">
<h2 style="margin:0 0 12px">{titulo}</h2>
<p>{intro}</p>
<p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:16px 0">{codigo}</p>
<p style="color:#666;font-size:13px">{aviso}</p>
</div>"""
    return texto, html


# [F191] Envia a mensagem usando o serviço Resend.
def _enviar_resend(destinatario: str, assunto: str, texto: str, html: str) -> None:
    resposta = httpx.post(
        RESEND_URL,
        headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
        json={
            "from": settings.RESEND_FROM,
            "to": [destinatario],
            "subject": assunto,
            "text": texto,
            "html": html,
        },
        timeout=RESEND_TIMEOUT_SEGUNDOS,
    )
    if resposta.is_error:
        # O corpo do erro do Resend explica o motivo (domínio não verificado,
        # chave inválida...) e não carrega segredo, então ajuda a diagnosticar.
        logger.error("Resend recusou o envio (HTTP %s): %s", resposta.status_code, resposta.text[:300])
        resposta.raise_for_status()


# [F192] Envia a mensagem usando o servidor SMTP configurado.
def _enviar_smtp(destinatario: str, assunto: str, texto: str, html: str) -> None:
    remetente = settings.SMTP_FROM or settings.SMTP_USER
    mensagem = EmailMessage()
    mensagem["Subject"] = assunto
    mensagem["From"] = formataddr((settings.SMTP_NOME_REMETENTE, remetente))
    mensagem["To"] = destinatario
    mensagem.set_content(texto)
    mensagem.add_alternative(html, subtype="html")
    if settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(
            settings.SMTP_HOST, settings.SMTP_PORT, timeout=10, context=ssl.create_default_context()
        ) as servidor:
            _entregar(servidor, mensagem)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as servidor:
            servidor.starttls(context=ssl.create_default_context())
            _entregar(servidor, mensagem)


# [F193] Escolhe e executa o canal configurado para entregar o e-mail.
def _entregar(servidor: smtplib.SMTP, mensagem: EmailMessage) -> None:
    if settings.SMTP_USER:
        servidor.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    servidor.send_message(mensagem)


# [F194] Monta e entrega uma mensagem com o código de confirmação.
def _enviar_codigo(destinatario: str, codigo: str, *, rotulo: str, assunto: str, titulo: str, intro: str) -> None:
    """
    Envia pelo Resend (ou SMTP, se o Resend não estiver configurado). Sem nenhum
    provedor, só o ambiente de desenvolvimento segue (o código vai para o log do
    servidor); em produção a falta de provedor é um erro explícito, e não um
    fluxo que ninguém consegue concluir.
    """
    if not email_configurado():
        if settings.is_production:
            logger.error("Nem RESEND_API_KEY/RESEND_FROM nem SMTP configurados: não é possível enviar o %s.", rotulo)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Não foi possível enviar o e-mail agora. Tente mais tarde.",
            )
        logger.warning("E-mail não configurado. %s de %s: %s", rotulo.capitalize(), destinatario, codigo)
        return

    texto, html = _corpo_codigo(titulo, intro, codigo)
    try:
        if resend_configurado():
            _enviar_resend(destinatario, assunto, texto, html)
        else:
            _enviar_smtp(destinatario, assunto, texto, html)
    except (smtplib.SMTPException, httpx.HTTPError, OSError) as erro:
        logger.error("Falha ao enviar o %s: %s", rotulo, erro)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível enviar o e-mail agora. Tente mais tarde.",
        ) from erro


# [F195] Envia o código usado para confirmar o endereço de e-mail.
def enviar_codigo_verificacao(destinatario: str, codigo: str) -> None:
    _enviar_codigo(
        destinatario,
        codigo,
        rotulo="código de verificação",
        assunto=f"{codigo} é o seu código do KaorCount",
        titulo="Confirme o seu e-mail",
        intro="Use este código para continuar o cadastro no KaorCount.",
    )


# [F196] Envia o código usado para redefinir a senha.
def enviar_codigo_recuperacao_senha(destinatario: str, codigo: str) -> None:
    _enviar_codigo(
        destinatario,
        codigo,
        rotulo="código de recuperação de senha",
        assunto=f"{codigo} é o código para redefinir a sua senha do KaorCount",
        titulo="Redefina a sua senha",
        intro="Recebemos um pedido para redefinir a senha da sua conta no KaorCount.",
    )
