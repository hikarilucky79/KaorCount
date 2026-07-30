import uuid
from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class HistoricoProgresso(Base):
    __tablename__ = "historico_progresso"

    id_progresso = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_usuario = Column(CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, index=True)
    data_registro = Column(Date, nullable=False)
    peso_atual = Column(Float, nullable=False)
    altura_atual = Column(Float, nullable=False)

    usuario = relationship("Usuario", back_populates="historico_progresso")
