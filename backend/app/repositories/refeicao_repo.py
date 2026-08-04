from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.refeicao import Refeicao
from app.repositories.base import BaseRepository


class RefeicaoRepository(BaseRepository[Refeicao]):
    def __init__(self, db: Session):
        super().__init__(Refeicao, db)

    def get_by_id(self, id_refeicao: UUID | str) -> Refeicao | None:
        return self.get("id_refeicao", id_refeicao)

    def get_by_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[Refeicao]:
        return (
            self.db.query(Refeicao)
            .filter(Refeicao.id_usuario == str(id_usuario))
            .order_by(Refeicao.data_refeicao.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[Refeicao]:
        return (
            self.db.query(Refeicao)
            .filter(
                Refeicao.id_usuario == str(id_usuario),
                Refeicao.data_refeicao >= data_inicio,
                Refeicao.data_refeicao <= data_fim,
            )
            .order_by(Refeicao.data_refeicao.desc())
            .all()
        )

    def get_by_dia(self, id_usuario: UUID | str, data: date) -> list[Refeicao]:
        return (
            self.db.query(Refeicao)
            .filter(Refeicao.id_usuario == str(id_usuario), Refeicao.data_refeicao == data)
            .order_by(Refeicao.data_refeicao.desc())
            .all()
        )
