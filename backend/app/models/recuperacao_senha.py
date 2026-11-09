from sqlalchemy import Column, DateTime, Integer, String

from app.core.database import Base


class RecuperacaoSenha(Base):
    """
    Código pendente de redefinição de senha. Guarda só o HMAC do código (nunca o
    código em claro) e há no máximo uma linha por e-mail: pedir outro código
    substitui o anterior e zera as tentativas.
    """

    __tablename__ = "recuperacao_senha"

    email = Column(String(255), primary_key=True)
    codigo_hash = Column(String(64), nullable=False)
    expira_em = Column(DateTime, nullable=False)
    enviado_em = Column(DateTime, nullable=False)
    tentativas = Column(Integer, nullable=False, default=0)
