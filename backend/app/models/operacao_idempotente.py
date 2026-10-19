from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from datetime import datetime

from app.core.database import Base


class OperacaoIdempotente(Base):
    __tablename__ = "operacao_idempotente"

    # Hash de usuário + método + caminho + chave. Não armazena tokens ou senhas.
    id_operacao = Column(String(64), primary_key=True)
    assinatura = Column(String(64), nullable=False)
    status_http = Column(Integer, nullable=True)
    resposta = Column(Text().with_variant(LONGTEXT(), "mysql"), nullable=True)
    cabecalhos = Column(Text, nullable=True)
    criado_em = Column(DateTime, nullable=False, default=datetime.utcnow)
