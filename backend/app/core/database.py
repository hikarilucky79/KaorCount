import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

Base = declarative_base()

def criar_engine():
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite"):
        try:
            test_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 3},
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
