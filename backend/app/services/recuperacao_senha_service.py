import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limite import consumir
from app.core.security import hash_senha, normalizar_email
from app.core.senha import validar_forca_senha
from app.models.recuperacao_senha import RecuperacaoSenha
from app.repositories.usuario_repo import UsuarioRepository
from app.services.email_service import email_configurado, enviar_codigo_recuperacao_senha
from app.services.verificacao_email_service import (
    CODIGOS_POR_EMAIL,
    JANELA_CODIGOS_EMAIL_SEGUNDOS,
    _rejeitar_espera,
)

logger = logging.getLogger("kaorcount.recuperacao_senha")


# [F244] Gera um hash seguro para armazenar e comparar códigos de recuperação.
def _hash_codigo(email: str, codigo: str) -> str:
    # O prefixo separa estes códigos dos de verificação de cadastro: o mesmo
    # número nunca gera o mesmo hash nas duas tabelas.
    return hmac.new(settings.SECRET_KEY.encode(), f"senha:{email}:{codigo}".encode(), hashlib.sha256).hexdigest()


class RecuperacaoSenhaService:
    # [F245] Inicializa a classe RecuperacaoSenhaService.
    def __init__(self, db: Session):
        self.db = db
        self.repo = UsuarioRepository(db)

    # [F246] Gera um código temporário e envia a mensagem de recuperação de senha.
    def solicitar_codigo(self, email: str) -> None:
        """
        Resposta idêntica exista a conta ou não: do contrário esta rota serviria
        para descobrir quem tem cadastro. Por isso os tetos abaixo valem para
        qualquer e-mail, e uma falha de envio para uma conta real é só logada.
        """
        if settings.is_production and not email_configurado():
            # Erro de configuração do servidor, igual para todos os e-mails.
            logger.error("Recuperação de senha sem provedor de e-mail configurado.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Não foi possível enviar o e-mail agora. Tente mais tarde.",
            )

        email = normalizar_email(email)
        impressao = hashlib.sha256(email.encode()).hexdigest()

        # Intervalo de reenvio: consumir() rejeita ao atingir o teto, então 2
        # deixa passar exatamente um pedido por janela.
        _, restante = consumir(self.db, "senharenv:" + impressao, 2, settings.CODIGO_EMAIL_REENVIO_SEGUNDOS)
        if restante <= 0:
            _rejeitar_espera("Aguarde um instante para pedir um novo código.", settings.CODIGO_EMAIL_REENVIO_SEGUNDOS)

        _, restante = consumir(self.db, "senhacod:" + impressao, CODIGOS_POR_EMAIL + 1, JANELA_CODIGOS_EMAIL_SEGUNDOS)
        if restante <= 0:
            _rejeitar_espera("Muitos códigos pedidos para este e-mail. Tente mais tarde.", JANELA_CODIGOS_EMAIL_SEGUNDOS)

        usuario = self.repo.get_by_email(email)
        if usuario is None or usuario.status_conta != "ativo":
            return

        codigo = f"{secrets.randbelow(10**6):06d}"
        agora = datetime.utcnow()
        expira_em = agora + timedelta(minutes=settings.CODIGO_EMAIL_VALIDADE_MINUTOS)
        linha = self.db.get(RecuperacaoSenha, email)
        if linha is None:
            self.db.add(RecuperacaoSenha(
                email=email,
                codigo_hash=_hash_codigo(email, codigo),
                expira_em=expira_em,
                enviado_em=agora,
                tentativas=0,
            ))
        else:
            linha.codigo_hash = _hash_codigo(email, codigo)
            linha.expira_em = expira_em
            linha.enviado_em = agora
            linha.tentativas = 0
        self.db.commit()

        try:
            enviar_codigo_recuperacao_senha(email, codigo)
        except Exception:
            logger.exception("Falha ao enviar o código de recuperação de senha.")
            linha = self.db.get(RecuperacaoSenha, email)
            if linha is not None:
                self.db.delete(linha)
                self.db.commit()

    # [F247] Confirma o código recebido e altera a senha da conta.
    def redefinir(self, email: str, codigo: str, nova_senha: str) -> None:
        email = normalizar_email(email)
        invalido = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código inválido ou expirado.")

        linha = self.db.get(RecuperacaoSenha, email)
        if linha is None or linha.expira_em < datetime.utcnow():
            raise invalido

        # A tentativa é contada antes da comparação, no próprio UPDATE, para que
        # confirmações simultâneas não passem do teto.
        self.db.query(RecuperacaoSenha).filter(RecuperacaoSenha.email == email).update(
            {RecuperacaoSenha.tentativas: RecuperacaoSenha.tentativas + 1}
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

        usuario = self.repo.get_by_email(email)
        if usuario is None or usuario.status_conta != "ativo":
            raise invalido

        # Só depois do código certo: antes disso, a mensagem sobre "conter o seu
        # nome" revelaria o nome de uma conta a quem não tem o código. A linha
        # fica, então um erro de senha não obriga a pedir outro código.
        problema = validar_forca_senha(nova_senha, usuario.email, usuario.nome)
        if problema:
            raise HTTPException(status_code=422, detail=problema)

        usuario.senha_hash = hash_senha(nova_senha)
        # Código de uso único, na mesma transação da troca de senha.
        self.db.delete(linha)
        self.db.commit()
