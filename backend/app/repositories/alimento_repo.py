from uuid import UUID
from sqlalchemy.orm import Session

from app.models.alimento import Alimento
from app.repositories.base import BaseRepository


class AlimentoRepository(BaseRepository[Alimento]):
    def __init__(self, db: Session):
        super().__init__(Alimento, db)

    def get_by_id(self, id_alimento: UUID | str) -> Alimento | None:
        return self.get("id_alimento", id_alimento)

    def search_by_name(self, nome: str, skip: int = 0, limit: int = 50) -> list[Alimento]:
        return (
            self.db.query(Alimento)
            .filter(Alimento.nome_alimento.ilike(f"%{nome}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, obj_data: dict) -> Alimento:
        return super().create(obj_data)

    def update(self, db_obj: Alimento, obj_data: dict) -> Alimento:
        return super().update(db_obj, obj_data)

    def delete(self, db_obj: Alimento) -> None:
        super().delete(db_obj)
