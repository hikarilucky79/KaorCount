import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    senha_hash = Column(LargeBinary(60), nullable=False)
    data_cadastro = Column(DateTime, nullable=False, default=datetime.utcnow)
    status_conta = Column(String(20), nullable=False, default="ativo")

    perfil_nutri = relationship("PerfilNutri", back_populates="usuario", uselist=False, cascade="all, delete-orphan")
    metas_nutri = relationship("MetaNutri", back_populates="usuario", cascade="all, delete-orphan")
    registros_agua = relationship("RegistroAgua", back_populates="usuario", cascade="all, delete-orphan")
    refeicoes = relationship("Refeicao", back_populates="usuario", cascade="all, delete-orphan")
    historico_progresso = relationship("HistoricoProgresso", back_populates="usuario", cascade="all, delete-orphan")
