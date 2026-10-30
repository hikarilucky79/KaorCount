from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from app.core.database import Base


class PreferenciaUsuario(Base):
    __tablename__ = "preferencia_usuario"

    id_usuario = Column(CHAR(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True)
    tema = Column(String(10), nullable=False, default="claro")
    unidade_peso = Column(String(5), nullable=False, default="kg")
    unidade_altura = Column(String(5), nullable=False, default="cm")
    unidade_agua = Column(String(5), nullable=False, default="ml")
    periodo_grafico = Column(Integer, nullable=False, default=7)
    notificacoes_push = Column(Boolean, nullable=False, default=True)

    usuario = relationship("Usuario", back_populates="preferencias")
