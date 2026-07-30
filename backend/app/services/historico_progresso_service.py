from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.historico_progresso import HistoricoProgresso
from app.repositories.historico_progresso_repo import HistoricoProgressoRepository
from app.schemas.historico_progresso import HistoricoProgressoCreate, HistoricoProgressoUpdate

from fastapi import HTTPException, status


class HistoricoProgressoService:
    def __init__(self, db: Session):
        self.repo = HistoricoProgressoRepository(db)

    def buscar_por_id(self, id_progresso: UUID | str) -> HistoricoProgresso:
        registro = self.repo.get_by_id(id_progresso)
        if not registro:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registro de progresso não encontrado",
            )
        return registro

    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[HistoricoProgresso]:
        return self.repo.get_by_usuario(id_usuario, skip, limit)

    def listar_por_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[HistoricoProgresso]:
        return self.repo.get_by_periodo(id_usuario, data_inicio, data_fim)

    def criar(self, dados: HistoricoProgressoCreate) -> HistoricoProgresso:
        return self.repo.create(dados.model_dump())

    def atualizar(self, id_progresso: UUID | str, dados: HistoricoProgressoUpdate) -> HistoricoProgresso:
        registro = self.buscar_por_id(id_progresso)
        return self.repo.update(registro, dados.model_dump(exclude_unset=True))

    def deletar(self, id_progresso: UUID | str) -> None:
        registro = self.buscar_por_id(id_progresso)
        self.repo.delete(registro)
