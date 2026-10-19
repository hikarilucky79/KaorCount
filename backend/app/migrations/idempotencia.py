"""Executar com python -m app.migrations.idempotencia antes do deploy."""
from sqlalchemy import Index, MetaData, Table, inspect, text

from app.core.database import engine
from app.models.operacao_idempotente import OperacaoIdempotente


def aplicar(bind):
    OperacaoIdempotente.__table__.create(bind, checkfirst=True)
    inspetor = inspect(bind)
    if not inspetor.has_table("meta_nutri"):
        return
    existentes = inspetor.get_unique_constraints("meta_nutri") + inspetor.get_indexes("meta_nutri")
    if any(set(i.get("column_names", [])) == {"id_usuario", "data_inicio"} and i.get("unique", True) for i in existentes):
        return
    with bind.connect() as conn:
        duplicada = conn.execute(text(
            "SELECT id_usuario, data_inicio FROM meta_nutri "
            "GROUP BY id_usuario, data_inicio HAVING COUNT(*) > 1 LIMIT 1"
        )).first()
        if duplicada:
            raise RuntimeError("Há metas duplicadas por usuário/data. Revise esses registros antes de aplicar a restrição; nenhum dado foi apagado.")
    tabela = Table("meta_nutri", MetaData(), autoload_with=bind)
    Index("uq_meta_usuario_dia", tabela.c.id_usuario, tabela.c.data_inicio, unique=True).create(bind)


if __name__ == "__main__":
    if engine.dialect.name not in {"mysql", "mariadb"}:
        raise SystemExit(
            "Migração cancelada: a conexão ativa não é MySQL/TiDB. "
            "Configure DATABASE_URL e confirme o acesso ao banco de destino; "
            "o fallback SQLite não pode receber esta migração."
        )
    aplicar(engine)
    print("Migração de idempotência aplicada.")
