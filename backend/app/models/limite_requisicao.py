from sqlalchemy import Column, DateTime, Integer, String

from app.core.database import Base


class LimiteRequisicao(Base):
    """
    Contador de janela fixa para o rate limit. Mora no banco e não em memória
    porque cada instância da função serverless tem a sua: um contador local
    zera a cada cold start e não vê o que o vizinho já consumiu.
    """

    __tablename__ = "limite_requisicao"

    chave = Column(String(120), primary_key=True)
    janela_inicio = Column(DateTime, nullable=False)
    quantidade = Column(Integer, nullable=False, default=1)
