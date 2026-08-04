from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.refeicao import Refeicao
from app.models.item_refeicao import ItemRefeicao
from app.repositories.refeicao_repo import RefeicaoRepository
from app.repositories.item_refeicao_repo import ItemRefeicaoRepository
from app.repositories.alimento_repo import AlimentoRepository
from app.services.nutricao_service import NutricaoService
from app.services.base_service import BaseService
from fastapi import HTTPException, status


class RefeicaoService(BaseService):
    nao_encontrado_msg = "Refeição não encontrada"

    def __init__(self, db: Session):
        super().__init__(RefeicaoRepository(db))
        self.item_repo = ItemRefeicaoRepository(db)
        self.alimento_repo = AlimentoRepository(db)

    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[Refeicao]:
        return self.repo.get_by_usuario(id_usuario, skip, limit)

    def listar_por_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[Refeicao]:
        return self.repo.get_by_periodo(id_usuario, data_inicio, data_fim)

    def listar_por_dia(self, id_usuario: UUID | str, data: date) -> list[Refeicao]:
        return self.repo.get_by_dia(id_usuario, data)

    def adicionar_item(self, dados) -> ItemRefeicao:
        if not self.alimento_repo.get_by_id(dados.id_alimento):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alimento não encontrado")
        return self.item_repo.create(dados.model_dump())

    def listar_itens(self, id_refeicao: UUID | str) -> list[ItemRefeicao]:
        return self.item_repo.get_by_refeicao(id_refeicao)

    def atualizar_item(self, id_item: UUID | str, dados) -> ItemRefeicao:
        item = self.item_repo.get_by_id(id_item)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
        return self.item_repo.update(item, dados.model_dump(exclude_unset=True))

    def remover_item(self, id_item: UUID | str) -> None:
        item = self.item_repo.get_by_id(id_item)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
        self.item_repo.delete(item)

    def resumo_macros_dia(self, id_usuario: UUID | str, data: date) -> dict:
        refeicoes = self.repo.get_by_dia(id_usuario, data)
        total = {"calorias": 0.0, "carboidratos": 0.0, "proteinas": 0.0, "gorduras": 0.0}

        for refeicao in refeicoes:
            for item in self.item_repo.get_by_refeicao(refeicao.id_refeicao):
                macros = NutricaoService.calcular_macros_item(
                    calorias_porcao=item.alimento.calorias,
                    carb_porcao=item.alimento.carboidratos,
                    prot_porcao=item.alimento.proteinas,
                    gord_porcao=item.alimento.gorduras,
                    porcao_padrao_g=item.alimento.porcao_padrao_g,
                    quantidade_g=item.quantidade_alimento_g,
                )
                for k in total:
                    total[k] += macros[k]

        return {k: round(v, 2) for k, v in total.items()}
