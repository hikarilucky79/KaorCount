from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.historico_progresso import HistoricoProgresso
from app.repositories.historico_progresso_repo import HistoricoProgressoRepository
from app.services.base_service import BaseService
from app.schemas.historico_progresso import HistoricoProgressoCreate


class HistoricoProgressoService(BaseService):
    nao_encontrado_msg = "Registro de progresso não encontrado"

    def __init__(self, db: Session):
        super().__init__(HistoricoProgressoRepository(db))

    def criar(self, dados: HistoricoProgressoCreate) -> HistoricoProgresso:
        # Upsert: uma linha por (id_usuario, data_registro). Sem esse comportamento,
        # cada edição de perfil no mesmo dia criava uma nova linha e a consulta do
        # "último registro" (ORDER BY data_registro DESC LIMIT 1) ficava ambígua —
        # o app podia continuar exibindo peso/altura antigos mesmo após salvar.
        existente = self.repo.get_by_usuario_dia(dados.id_usuario, dados.data_registro)
        if existente:
            return self.repo.update(existente, dados.model_dump(exclude={"id_usuario"}))
        return self.repo.create(dados.model_dump())

    def listar_por_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[HistoricoProgresso]:
        return self.repo.get_by_usuario(id_usuario, skip, limit)

    def listar_por_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[HistoricoProgresso]:
        return self.repo.get_by_periodo(id_usuario, data_inicio, data_fim)
