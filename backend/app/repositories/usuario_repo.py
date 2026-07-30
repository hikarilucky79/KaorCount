from uuid import UUID
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.repositories.base import BaseRepository


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, db: Session):
        super().__init__(Usuario, db)

    def get_by_id(self, id_usuario: UUID | str) -> Usuario | None:
        return self.get("id_usuario", id_usuario)

    def get_by_email(self, email: str) -> Usuario | None:
        return self.db.query(Usuario).filter(Usuario.email == email).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Usuario]:
        return super().get_all(skip, limit)

    def create(self, obj_data: dict) -> Usuario:
        return super().create(obj_data)

    def update(self, db_obj: Usuario, obj_data: dict) -> Usuario:
        return super().update(db_obj, obj_data)

    def delete(self, db_obj: Usuario) -> None:
        super().delete(db_obj)
