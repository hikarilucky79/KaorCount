from uuid import UUID
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.repositories.base import BaseRepository


class UsuarioRepository(BaseRepository[Usuario]):
    # [F158] Inicializa a classe UsuarioRepository.
    def __init__(self, db: Session):
        super().__init__(Usuario, db)

    # [F159] Busca um registro pelo identificador.
    def get_by_id(self, id_usuario: UUID | str) -> Usuario | None:
        return self.get("id_usuario", id_usuario)

    # [F160] Busca a conta associada ao endereço de e-mail.
    def get_by_email(self, email: str) -> Usuario | None:
        return self.db.query(Usuario).filter(Usuario.email == email).first()
