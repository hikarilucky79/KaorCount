from uuid import UUID

from sqlalchemy.orm import Session

from app.models.alimento import Alimento
from app.repositories.alimento_repo import AlimentoRepository
from app.schemas.alimento import AlimentoCreate, AlimentoUpdate

from fastapi import HTTPException, status


class AlimentoService:
    def __init__(self, db: Session):
        self.repo = AlimentoRepository(db)

    def buscar_por_id(self, id_alimento: UUID | str) -> Alimento:
        alimento = self.repo.get_by_id(id_alimento)
        if not alimento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alimento não encontrado",
            )
        return alimento

    def listar_todos(self, skip: int = 0, limit: int = 100) -> list[Alimento]:
        return self.repo.get_all(skip, limit)

    def buscar_por_nome(self, nome: str, skip: int = 0, limit: int = 50) -> list[Alimento]:
        return self.repo.search_by_name(nome, skip, limit)

    def criar(self, dados: AlimentoCreate) -> Alimento:
        return self.repo.create(dados.model_dump())

    def atualizar(self, id_alimento: UUID | str, dados: AlimentoUpdate) -> Alimento:
        alimento = self.buscar_por_id(id_alimento)
        return self.repo.update(alimento, dados.model_dump(exclude_unset=True))

    def deletar(self, id_alimento: UUID | str) -> None:
        alimento = self.buscar_por_id(id_alimento)
        self.repo.delete(alimento)
