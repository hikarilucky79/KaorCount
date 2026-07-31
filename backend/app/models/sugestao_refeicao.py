import uuid

from sqlalchemy import Column, Float, ForeignKey, String, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class SugestaoRefeicao(Base):
    __tablename__ = "sugestao_refeicao"

    id_sugestao = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_usuario = Column(CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, index=True)
    nome = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=True)
    tipo_refeicao = Column(String(50), nullable=False)
    calorias = Column(Float, nullable=False)
    carboidratos = Column(Float, nullable=False)
    proteinas = Column(Float, nullable=False)
    gorduras = Column(Float, nullable=False)
    alimentos_sugeridos = Column(Text, nullable=True)
    aceita = Column(Boolean, default=False)
    data_geracao = Column(String(10), nullable=False)

    usuario = relationship("Usuario")