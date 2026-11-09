from uuid import UUID
from sqlalchemy.orm import Session

from app.models.perfil_nutri import PerfilNutri
from app.repositories.base import BaseRepository


class PerfilNutriRepository(BaseRepository[PerfilNutri]):
    # [F144] Inicializa a classe PerfilNutriRepository.
    def __init__(self, db: Session):
        super().__init__(PerfilNutri, db)

    # [F145] Busca um registro pelo identificador.
    def get_by_id(self, id_perfil: UUID | str) -> PerfilNutri | None:
        return self.get("id_perfil", id_perfil)

    # [F146] Busca os registros associados a um usuário.
    def get_by_usuario(self, id_usuario: UUID | str) -> PerfilNutri | None:
        return self.db.query(PerfilNutri).filter(PerfilNutri.id_usuario == str(id_usuario)).first()
