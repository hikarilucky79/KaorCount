import os
import ssl

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

Base = declarative_base()


def _ssl_do_banco():
    """
    TiDB Cloud (e afins) exigem TLS e o certificado encadeia numa CA pública,
    então dá para verificar sem arquivo. O pymysql só liga check_hostname quando
    recebe um ssl_ca; sem ele, ssl_verify_identity é ignorado e sobra apenas a
    validação de cadeia. Aqui o contexto do sistema cobre os dois.
    """
    consulta = make_url(settings.DATABASE_URL).query
    if consulta.get("ssl_ca"):
        return None  # quem forneceu o PEM segue pelo caminho nativo do pymysql
    if consulta.get("ssl_verify_identity") or consulta.get("ssl_verify_cert"):
        return ssl.create_default_context()
    return None


def criar_engine():
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite"):
        connect_args = {"connect_timeout": 10}
        contexto_ssl = _ssl_do_banco()
        if contexto_ssl:
            connect_args["ssl"] = contexto_ssl
        try:
            test_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args=connect_args,
                echo=False,
            )
            with test_engine.connect() as conn:
                pass
            print("[Database] Conectado ao MySQL com sucesso.")
            return test_engine
        except Exception as e:
            # Em produção, cair silenciosamente para SQLite é perigoso: o
            # container parece saudável, mas os dados ficam num arquivo local
            # destruído a cada deploy. Melhor falhar alto e deixar o
            # healthcheck/orquestrador reiniciar o serviço.
            if settings.is_production:
                raise RuntimeError(
                    f"[Database] Falha crítica ao conectar no MySQL ({e}). "
                    "A API não sobe em produção sem o banco, para não perder dados."
                ) from e
            print(f"[Database] Aviso: MySQL não disponível ({e}). Usando SQLite local ('sqlite:///./kaorcount.db').")
            return create_engine(
                "sqlite:///./kaorcount.db",
                connect_args={"check_same_thread": False},
                echo=False,
            )
    return create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False,
    )

engine = criar_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
