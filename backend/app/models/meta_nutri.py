import uuid
from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class MetaNutri(Base):
    __tablename__ = "meta_nutri"

    id_meta = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_usuario = Column(CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, index=True)
    calorias_diarias = Column(Float, nullable=False)
    carboidrato_g = Column(Float, nullable=False)
    proteina_g = Column(Float, nullable=False)
    gordura_g = Column(Float, nullable=False)
    data_inicio = Column(Date, nullable=False)

    usuario = relationship("Usuario", back_populates="metas_nutri")
