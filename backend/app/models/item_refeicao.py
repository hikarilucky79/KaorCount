import uuid

from sqlalchemy import Column, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import CHAR

from app.core.database import Base


class ItemRefeicao(Base):
    __tablename__ = "item_refeicao"

    id_refeicao_item = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_refeicao = Column(CHAR(36), ForeignKey("refeicao.id_refeicao", ondelete="CASCADE"), nullable=False, index=True)
    id_alimento = Column(CHAR(36), ForeignKey("alimento.id_alimento"), nullable=False, index=True)
    quantidade_alimento_g = Column(Float, nullable=False)

    refeicao = relationship("Refeicao", back_populates="itens")
    alimento = relationship("Alimento")
