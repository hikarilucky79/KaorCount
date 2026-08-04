from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.registro_agua import RegistroAgua
from app.repositories.registro_agua_repo import RegistroAguaRepository
from app.services.base_service import BaseService


class RegistroAguaService(BaseService):
    nao_encontrado_msg = "Registro de água não encontrado"

    def __init__(self, db: Session):
        super().__init__(RegistroAguaRepository(db))

    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[RegistroAgua]:
        return self.repo.get_by_usuario(id_usuario, skip, limit)

    def total_dia(self, id_usuario: UUID | str, data: date) -> float:
        return self.repo.get_total_dia(id_usuario, data)

    def listar_por_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[RegistroAgua]:
        return self.repo.get_by_periodo(id_usuario, data_inicio, data_fim)
