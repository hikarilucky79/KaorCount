from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meta_nutri import MetaNutri
from app.repositories.base import BaseRepository


class MetaNutriRepository(BaseRepository[MetaNutri]):
    def __init__(self, db: Session):
        super().__init__(MetaNutri, db)

    def get_by_id(self, id_meta: UUID | str) -> MetaNutri | None:
        return self.get("id_meta", id_meta)

    def get_by_usuario(self, id_usuario: UUID | str) -> list[MetaNutri]:
        return self.db.query(MetaNutri).filter(MetaNutri.id_usuario == str(id_usuario)).all()

    def get_meta_atual(self, id_usuario: UUID | str) -> MetaNutri | None:
        return (
            self.db.query(MetaNutri)
            .filter(MetaNutri.id_usuario == str(id_usuario))
            .order_by(MetaNutri.data_inicio.desc())
            .first()
        )

    def create(self, obj_data: dict) -> MetaNutri:
        return super().create(obj_data)

    def update(self, db_obj: MetaNutri, obj_data: dict) -> MetaNutri:
        return super().update(db_obj, obj_data)

    def delete(self, db_obj: MetaNutri) -> None:
        super().delete(db_obj)
