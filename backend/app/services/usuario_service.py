from uuid import UUID
from sqlalchemy.orm import Session

from app.core.security import hash_senha
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepository
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
from app.services.base_service import BaseService
from fastapi import HTTPException, status


class UsuarioService(BaseService):
    nao_encontrado_msg = "Usuário não encontrado"

    def __init__(self, db: Session):
        super().__init__(UsuarioRepository(db))

    def criar(self, dados: UsuarioCreate) -> Usuario:
        if self.repo.get_by_email(dados.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")
        return self.repo.create({
            "nome": dados.nome,
            "email": dados.email,
            "senha_hash": hash_senha(dados.senha),
        })

    def listar_todos(self, skip: int = 0, limit: int = 100) -> list[Usuario]:
        return self.repo.get_all(skip, limit)

    def atualizar(self, id_usuario: UUID | str, dados: UsuarioUpdate) -> Usuario:
        usuario = self.buscar_por_id(id_usuario)
        update_data = dados.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"] != usuario.email:
            if self.repo.get_by_email(update_data["email"]):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já está em uso")
        return self.repo.update(usuario, update_data)

    def desativar(self, id_usuario: UUID | str) -> None:
        usuario = self.buscar_por_id(id_usuario)
        self.repo.update(usuario, {"status_conta": "inativo"})
