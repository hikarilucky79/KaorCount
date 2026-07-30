from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.historico_progresso import HistoricoProgresso
from app.repositories.base import BaseRepository


class HistoricoProgressoRepository(BaseRepository[HistoricoProgresso]):
    def __init__(self, db: Session):
        super().__init__(HistoricoProgresso, db)

    def get_by_id(self, id_progresso: UUID | str) -> HistoricoProgresso | None:
        return self.get("id_progresso", id_progresso)

    def get_by_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[HistoricoProgresso]:
        return (
            self.db.query(HistoricoProgresso)
            .filter(HistoricoProgresso.id_usuario == str(id_usuario))
            .order_by(HistoricoProgresso.data_registro.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[HistoricoProgresso]:
        return (
            self.db.query(HistoricoProgresso)
            .filter(
                HistoricoProgresso.id_usuario == str(id_usuario),
                HistoricoProgresso.data_registro >= data_inicio,
                HistoricoProgresso.data_registro <= data_fim,
            )
            .order_by(HistoricoProgresso.data_registro.desc())
            .all()
        )

    def create(self, obj_data: dict) -> HistoricoProgresso:
        return super().create(obj_data)

    def update(self, db_obj: HistoricoProgresso, obj_data: dict) -> HistoricoProgresso:
        return super().update(db_obj, obj_data)

    def delete(self, db_obj: HistoricoProgresso) -> None:
        super().delete(db_obj)
