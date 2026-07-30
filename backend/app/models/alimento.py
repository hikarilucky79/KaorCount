import uuid

from sqlalchemy import Column, Float, String
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class Alimento(Base):
    __tablename__ = "alimento"

    id_alimento = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_alimento = Column(String(150), nullable=False, index=True)
    porcao_padrao_g = Column(Float, nullable=False, default=100.0)
    calorias = Column(Float, nullable=False)
    carboidratos = Column(Float, nullable=False)
    proteinas = Column(Float, nullable=False)
    gorduras = Column(Float, nullable=False)
    origem_dados = Column(String(100), nullable=True)
