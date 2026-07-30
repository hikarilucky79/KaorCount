from uuid import UUID
from sqlalchemy.orm import Session

from app.models.perfil_nutri import PerfilNutri
from app.repositories.base import BaseRepository


class PerfilNutriRepository(BaseRepository[PerfilNutri]):
    def __init__(self, db: Session):
        super().__init__(PerfilNutri, db)

    def get_by_id(self, id_perfil: UUID | str) -> PerfilNutri | None:
        return self.get("id_perfil", id_perfil)

    def get_by_usuario(self, id_usuario: UUID | str) -> PerfilNutri | None:
        return self.db.query(PerfilNutri).filter(PerfilNutri.id_usuario == str(id_usuario)).first()

    def create(self, obj_data: dict) -> PerfilNutri:
        return super().create(obj_data)

    def update(self, db_obj: PerfilNutri, obj_data: dict) -> PerfilNutri:
        return super().update(db_obj, obj_data)

    def delete(self, db_obj: PerfilNutri) -> None:
        super().delete(db_obj)
