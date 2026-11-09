from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.refeicao import Refeicao
from app.models.item_refeicao import ItemRefeicao
from app.repositories.base import BaseRepository


class RefeicaoRepository(BaseRepository[Refeicao]):
    # [F147] Inicializa a classe RefeicaoRepository.
    def __init__(self, db: Session):
        super().__init__(Refeicao, db)

    # [F148] Busca um registro pelo identificador.
    def get_by_id(self, id_refeicao: UUID | str) -> Refeicao | None:
        return self.get("id_refeicao", id_refeicao)

    # [F149] Busca os registros associados a um usuário.
    def get_by_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[Refeicao]:
        return (
            self.db.query(Refeicao)
            .filter(Refeicao.id_usuario == str(id_usuario))
            .order_by(Refeicao.data_refeicao.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # [F150] Busca os registros que pertencem ao período informado.
    def get_by_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[Refeicao]:
        return (
            self.db.query(Refeicao)
            .options(selectinload(Refeicao.itens).joinedload(ItemRefeicao.alimento))
            .filter(
                Refeicao.id_usuario == str(id_usuario),
                Refeicao.data_refeicao >= data_inicio,
                Refeicao.data_refeicao <= data_fim,
            )
            .order_by(Refeicao.data_refeicao.desc())
            .all()
        )

    # [F151] Busca as refeições do usuário em uma data específica.
    def get_by_dia(self, id_usuario: UUID | str, data: date) -> list[Refeicao]:
        return (
            self.db.query(Refeicao)
            .options(selectinload(Refeicao.itens).joinedload(ItemRefeicao.alimento))
            .filter(Refeicao.id_usuario == str(id_usuario), Refeicao.data_refeicao == data)
            .order_by(Refeicao.data_refeicao.desc())
            .all()
        )
