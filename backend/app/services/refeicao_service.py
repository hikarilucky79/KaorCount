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

    # [F248] Inicializa a classe RefeicaoService.
    def __init__(self, db: Session):
        super().__init__(RefeicaoRepository(db))
        self.item_repo = ItemRefeicaoRepository(db)
        self.alimento_repo = AlimentoRepository(db)

    # [F249] Lista registros associados ao usuário autenticado.
    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[Refeicao]:
        return self.repo.get_by_usuario(id_usuario, skip, limit)

    # [F250] Lista registros dentro do intervalo informado.
    def listar_por_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[Refeicao]:
        return self.repo.get_by_periodo(id_usuario, data_inicio, data_fim)

    # [F251] Lista refeições registradas em uma data.
    def listar_por_dia(self, id_usuario: UUID | str, data: date) -> list[Refeicao]:
        return self.repo.get_by_dia(id_usuario, data)

    # [F252] Adiciona um alimento à refeição.
    def adicionar_item(self, dados) -> ItemRefeicao:
        if not self.alimento_repo.get_by_id(dados.id_alimento):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alimento não encontrado")
        return self.item_repo.create(dados.model_dump())

    # [F253] Lista os alimentos associados a uma refeição.
    def listar_itens(self, id_refeicao: UUID | str) -> list[ItemRefeicao]:
        return self.item_repo.get_by_refeicao(id_refeicao)

    # [F254] Atualiza a quantidade ou os dados de um alimento da refeição.
    def atualizar_item(self, id_item: UUID | str, dados) -> ItemRefeicao:
        item = self.item_repo.get_by_id(id_item)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
        return self.item_repo.update(item, dados.model_dump(exclude_unset=True))

    # [F255] Remove um alimento da refeição.
    def remover_item(self, id_item: UUID | str) -> None:
        item = self.item_repo.get_by_id(id_item)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado")
        self.item_repo.delete(item)

    # [F256] Calcula o total diário de calorias e macronutrientes.
    def resumo_macros_dia(self, id_usuario: UUID | str, data: date) -> dict:
        refeicoes = self.repo.get_by_dia(id_usuario, data)
        total = {"calorias": 0.0, "carboidratos": 0.0, "proteinas": 0.0, "gorduras": 0.0}

        for refeicao in refeicoes:
            for item in refeicao.itens:
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
