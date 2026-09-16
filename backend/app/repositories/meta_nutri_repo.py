from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.meta_nutri import MetaNutri
from app.repositories.base import BaseRepository


class MetaNutriRepository(BaseRepository[MetaNutri]):
    def __init__(self, db: Session):
        super().__init__(MetaNutri, db)

    def get_by_id(self, id_meta: UUID | str) -> MetaNutri | None:
        return self.get("id_meta", id_meta)

    def get_by_usuario(self, id_usuario: UUID | str) -> list[MetaNutri]:
        return self.db.query(MetaNutri).filter(MetaNutri.id_usuario == str(id_usuario)).all()

    def get_by_usuario_dia(self, id_usuario: UUID | str, data_inicio: date) -> MetaNutri | None:
        return (
            self.db.query(MetaNutri)
            .filter(
                MetaNutri.id_usuario == str(id_usuario),
                MetaNutri.data_inicio == data_inicio,
            )
            .first()
        )

    def get_meta_atual(self, id_usuario: UUID | str) -> MetaNutri | None:
        # A "meta atual" é a de maior data_inicio. Como a criação é um upsert
        # por (id_usuario, data_inicio), não devem existir registros duplicados
        # no mesmo dia — isso evita que uma meta antiga seja devolvida no lugar
        # da meta recém-calculada após a edição de perfil.
        return (
            self.db.query(MetaNutri)
            .filter(MetaNutri.id_usuario == str(id_usuario))
            .order_by(MetaNutri.data_inicio.desc())
            .first()
        )
