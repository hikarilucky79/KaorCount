from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.registro_agua import RegistroAgua
from app.repositories.base import BaseRepository


class RegistroAguaRepository(BaseRepository[RegistroAgua]):
    def __init__(self, db: Session):
        super().__init__(RegistroAgua, db)

    def get_by_id(self, id_registro_agua: UUID | str) -> RegistroAgua | None:
        return self.get("id_registro_agua", id_registro_agua)

    def get_by_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[RegistroAgua]:
        return (
            self.db.query(RegistroAgua)
            .filter(RegistroAgua.id_usuario == str(id_usuario))
            .order_by(RegistroAgua.data_registro.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[RegistroAgua]:
        return (
            self.db.query(RegistroAgua)
            .filter(
                RegistroAgua.id_usuario == str(id_usuario),
                RegistroAgua.data_registro >= data_inicio,
                RegistroAgua.data_registro <= data_fim,
            )
            .order_by(RegistroAgua.data_registro.desc())
            .all()
        )

    def get_total_dia(self, id_usuario: UUID | str, data: date) -> float:
        registros = self.db.query(RegistroAgua).filter(
            RegistroAgua.id_usuario == str(id_usuario),
            RegistroAgua.data_registro == data,
        ).all()
        return sum(r.quantidade_ml for r in registros)
