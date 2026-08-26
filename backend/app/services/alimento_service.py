from uuid import UUID
from sqlalchemy.orm import Session

from app.models.alimento import Alimento
from app.repositories.alimento_repo import AlimentoRepository
from app.schemas.alimento import AlimentoCreate, AlimentoUpdate
from app.services.base_service import BaseService


class AlimentoService(BaseService):
    nao_encontrado_msg = "Alimento não encontrado"

    def __init__(self, db: Session):
        super().__init__(AlimentoRepository(db))

    def listar_todos(self, skip: int = 0, limit: int = 100) -> list[Alimento]:
        return self.repo.get_all(skip, limit)

    def buscar_por_nome(self, nome: str, skip: int = 0, limit: int = 50) -> list[Alimento]:
        return self.repo.search_by_name(nome, skip, limit)
