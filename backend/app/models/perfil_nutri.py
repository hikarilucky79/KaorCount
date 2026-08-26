import uuid
from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class PerfilNutri(Base):
    __tablename__ = "perfil_nutri"

    id_perfil = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_usuario = Column(CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    data_nascimento = Column(Date, nullable=False)
    genero = Column(String(20), nullable=False)
    objetivo_nutricional = Column(String(50), nullable=False)
    nivel_atividade = Column(String(50), nullable=False)
    tmb_calculo = Column(Float, nullable=True)

    usuario = relationship("Usuario", back_populates="perfil_nutri")
