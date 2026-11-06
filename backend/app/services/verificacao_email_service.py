import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limite import consumir
from app.core.security import criar_token_email_verificado, normalizar_email
from app.models.verificacao_email import VerificacaoEmail
from app.repositories.usuario_repo import UsuarioRepository
from app.services.email_service import enviar_codigo_verificacao

# Teto de códigos por endereço, além do teto por IP: sem ele, trocar de IP
# bastaria para encher a caixa de entrada de outra pessoa.
CODIGOS_POR_EMAIL = 5
JANELA_CODIGOS_EMAIL_SEGUNDOS = 3600


def _hash_codigo(email: str, codigo: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), f"{email}:{codigo}".encode(), hashlib.sha256).hexdigest()


def _rejeitar_espera(detalhe: str, segundos: int) -> None:
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=detalhe,
        headers={"Retry-After": str(max(segundos, 1))},
    )


class VerificacaoEmailService:
    def __init__(self, db: Session):
        self.db = db

    def enviar_codigo(self, email: str) -> None:
        email = normalizar_email(email)
        if UsuarioRepository(self.db).get_by_email(email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")

        agora = datetime.utcnow()
        anterior = self.db.get(VerificacaoEmail, email)
        if anterior is not None:
            espera = settings.CODIGO_EMAIL_REENVIO_SEGUNDOS - (agora - anterior.enviado_em).total_seconds()
            if espera > 0:
                _rejeitar_espera("Aguarde um instante para pedir um novo código.", int(espera) + 1)

        chave = "emailcod:" + hashlib.sha256(email.encode()).hexdigest()
        # consumir() rejeita ao atingir o teto (restante == 0), por isso o +1.
        _, restante = consumir(self.db, chave, CODIGOS_POR_EMAIL + 1, JANELA_CODIGOS_EMAIL_SEGUNDOS)
        if restante <= 0:
            _rejeitar_espera("Muitos códigos pedidos para este e-mail. Tente mais tarde.", JANELA_CODIGOS_EMAIL_SEGUNDOS)

        codigo = f"{secrets.randbelow(10**6):06d}"
        if anterior is None:
            self.db.add(VerificacaoEmail(
                email=email,
                codigo_hash=_hash_codigo(email, codigo),
                expira_em=agora + timedelta(minutes=settings.CODIGO_EMAIL_VALIDADE_MINUTOS),
                enviado_em=agora,
                tentativas=0,
            ))
        else:
            anterior.codigo_hash = _hash_codigo(email, codigo)
            anterior.expira_em = agora + timedelta(minutes=settings.CODIGO_EMAIL_VALIDADE_MINUTOS)
            anterior.enviado_em = agora
            anterior.tentativas = 0
        self.db.commit()

        try:
            enviar_codigo_verificacao(email, codigo)
        except Exception:
            # Falha de envio não pode gastar o intervalo de reenvio da pessoa.
            linha = self.db.get(VerificacaoEmail, email)
            if linha is not None:
                self.db.delete(linha)
                self.db.commit()
            raise

    def confirmar_codigo(self, email: str, codigo: str) -> str:
        email = normalizar_email(email)
        invalido = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código inválido ou expirado.")

        linha = self.db.get(VerificacaoEmail, email)
        if linha is None or linha.expira_em < datetime.utcnow():
            raise invalido

        # A tentativa é contada antes da comparação, no próprio UPDATE, para que
        # confirmações simultâneas não passem do teto.
        self.db.query(VerificacaoEmail).filter(VerificacaoEmail.email == email).update(
            {VerificacaoEmail.tentativas: VerificacaoEmail.tentativas + 1}
        )
        self.db.commit()
        self.db.refresh(linha)
        if linha.tentativas > settings.CODIGO_EMAIL_MAX_TENTATIVAS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Muitas tentativas. Peça um novo código.",
            )

        if not hmac.compare_digest(linha.codigo_hash, _hash_codigo(email, codigo)):
            raise invalido

        # Código de uso único.
        self.db.delete(linha)
        self.db.commit()
        return criar_token_email_verificado(email)
