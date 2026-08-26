import uuid
from datetime import date

from sqlalchemy import Column, Date, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class Refeicao(Base):
    __tablename__ = "refeicao"

    id_refeicao = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_usuario = Column(CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, index=True)
    data_refeicao = Column(Date, nullable=False)
    tipo_refeicao = Column(String(50), nullable=False)

    usuario = relationship("Usuario", back_populates="refeicoes")
    itens = relationship("ItemRefeicao", back_populates="refeicao", cascade="all, delete-orphan")
