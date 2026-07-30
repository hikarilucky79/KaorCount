from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.registro_agua import RegistroAgua
from app.repositories.registro_agua_repo import RegistroAguaRepository
from app.schemas.registro_agua import RegistroAguaCreate, RegistroAguaUpdate

from fastapi import HTTPException, status


class RegistroAguaService:
    def __init__(self, db: Session):
        self.repo = RegistroAguaRepository(db)

    def buscar_por_id(self, id_registro: UUID | str) -> RegistroAgua:
        registro = self.repo.get_by_id(id_registro)
        if not registro:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registro de água não encontrado",
            )
        return registro

    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[RegistroAgua]:
        return self.repo.get_by_usuario(id_usuario, skip, limit)

    def total_dia(self, id_usuario: UUID | str, data: date) -> float:
        return self.repo.get_total_dia(id_usuario, data)

    def listar_por_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[RegistroAgua]:
        return self.repo.get_by_periodo(id_usuario, data_inicio, data_fim)

    def criar(self, dados: RegistroAguaCreate) -> RegistroAgua:
        return self.repo.create(dados.model_dump())

    def atualizar(self, id_registro: UUID | str, dados: RegistroAguaUpdate) -> RegistroAgua:
        registro = self.buscar_por_id(id_registro)
        return self.repo.update(registro, dados.model_dump(exclude_unset=True))

    def deletar(self, id_registro: UUID | str) -> None:
        registro = self.buscar_por_id(id_registro)
        self.repo.delete(registro)
