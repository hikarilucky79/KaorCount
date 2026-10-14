import uuid

from sqlalchemy import Boolean, Column, Float, ForeignKey, String
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class PesquisaInicial(Base):
    __tablename__ = "pesquisa_inicial"

    id_pesquisa = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_usuario = Column(
        CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    origem_app = Column(String(50), nullable=False)
    ja_contou_calorias = Column(Boolean, nullable=False)
    peso_objetivo_kg = Column(Float, nullable=False)
