import uuid
from sqlalchemy import Column, Float, ForeignKey, Integer, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR
from app.core.database import Base


class LembreteConfig(Base):
    __tablename__ = "lembrete_config"

    id_lembrete = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_usuario = Column(CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    agua_intervalo_min = Column(Integer, nullable=False, default=120)
    agua_meta_diaria_ml = Column(Float, nullable=False, default=2000.0)
    refeicao_horarios = Column(Text, nullable=True)
    ativo = Column(Boolean, nullable=False, default=True)

    usuario = relationship("Usuario")