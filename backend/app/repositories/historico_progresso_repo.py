from datetime import date
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.historico_progresso import HistoricoProgresso
from app.repositories.base import BaseRepository


class HistoricoProgressoRepository(BaseRepository[HistoricoProgresso]):
    # [F131] Inicializa a classe HistoricoProgressoRepository.
    def __init__(self, db: Session):
        super().__init__(HistoricoProgresso, db)

    # [F132] Busca um registro pelo identificador.
    def get_by_id(self, id_progresso: UUID | str) -> HistoricoProgresso | None:
        return self.get("id_progresso", id_progresso)

    # [F133] Busca os registros associados a um usuário.
    def get_by_usuario(self, id_usuario: UUID | str, skip: int = 0, limit: int = 100) -> list[HistoricoProgresso]:
        return (
            self.db.query(HistoricoProgresso)
            .filter(HistoricoProgresso.id_usuario == str(id_usuario))
            .order_by(
                HistoricoProgresso.data_registro.desc(),
                # ↓ Desempate determinístico: com o upsert por dia não existem
                #   mais linhas repetidas; o id garante ordem estável para
                #   registros antigos que já estejam duplicados no banco.
                HistoricoProgresso.id_progresso.asc(),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    # [F134] Busca os registros que pertencem ao período informado.
    def get_by_periodo(self, id_usuario: UUID | str, data_inicio: date, data_fim: date) -> list[HistoricoProgresso]:
        return (
            self.db.query(HistoricoProgresso)
            .filter(
                HistoricoProgresso.id_usuario == str(id_usuario),
                HistoricoProgresso.data_registro >= data_inicio,
                HistoricoProgresso.data_registro <= data_fim,
            )
            .order_by(
                HistoricoProgresso.data_registro.desc(),
                HistoricoProgresso.id_progresso.asc(),
            )
            .all()
        )

    # [F135] Busca o registro do usuário correspondente a uma data.
    def get_by_usuario_dia(self, id_usuario: UUID | str, data_registro: date) -> HistoricoProgresso | None:
        return (
            self.db.query(HistoricoProgresso)
            .filter(
                HistoricoProgresso.id_usuario == str(id_usuario),
                HistoricoProgresso.data_registro == data_registro,
            )
            .first()
        )
