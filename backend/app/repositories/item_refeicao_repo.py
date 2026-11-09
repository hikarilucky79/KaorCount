from uuid import UUID
from sqlalchemy.orm import Session

from app.models.item_refeicao import ItemRefeicao
from app.repositories.base import BaseRepository


class ItemRefeicaoRepository(BaseRepository[ItemRefeicao]):
    # [F136] Inicializa a classe ItemRefeicaoRepository.
    def __init__(self, db: Session):
        super().__init__(ItemRefeicao, db)

    # [F137] Busca um registro pelo identificador.
    def get_by_id(self, id_refeicao_item: UUID | str) -> ItemRefeicao | None:
        return self.get("id_refeicao_item", id_refeicao_item)

    # [F138] Lista os itens vinculados a uma refeição.
    def get_by_refeicao(self, id_refeicao: UUID | str) -> list[ItemRefeicao]:
        return self.db.query(ItemRefeicao).filter(ItemRefeicao.id_refeicao == str(id_refeicao)).all()
