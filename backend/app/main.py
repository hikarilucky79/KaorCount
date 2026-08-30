from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, OperationalError, DataError

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.alimento import Alimento
import app.models  # noqa: F401

# Cria as tabelas no banco de dados automaticamente se não existirem
try:
    Base.metadata.create_all(bind=engine)
    # Popular base de alimentos inicial se estiver vazia
    with SessionLocal() as db:
        if db.query(Alimento).count() == 0:
            alimentos_iniciais = [
                Alimento(nome_alimento="Peito de Frango (grelhado)", porcao_padrao_g=100.0, calorias=165.0, proteinas=31.0, carboidratos=0.0, gorduras=3.6, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Arroz Branco (cozido)", porcao_padrao_g=100.0, calorias=130.0, proteinas=2.7, carboidratos=28.0, gorduras=0.3, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Feijão Preto (cozido)", porcao_padrao_g=100.0, calorias=132.0, proteinas=8.9, carboidratos=24.0, gorduras=0.5, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Ovo Cozido", porcao_padrao_g=50.0, calorias=78.0, proteinas=6.3, carboidratos=0.6, gorduras=5.3, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Banana Prata", porcao_padrao_g=100.0, calorias=89.0, proteinas=1.1, carboidratos=23.0, gorduras=0.3, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Batata Doce (cozida)", porcao_padrao_g=100.0, calorias=86.0, proteinas=1.6, carboidratos=20.0, gorduras=0.1, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Pão Francês", porcao_padrao_g=50.0, calorias=150.0, proteinas=4.0, carboidratos=29.0, gorduras=1.5, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Aveia em Flocos", porcao_padrao_g=30.0, calorias=117.0, proteinas=4.3, carboidratos=20.0, gorduras=2.2, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Queijo Minas Frescal", porcao_padrao_g=30.0, calorias=79.0, proteinas=5.2, carboidratos=1.0, gorduras=6.0, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Azeite de Oliva", porcao_padrao_g=13.0, calorias=119.0, proteinas=0.0, carboidratos=0.0, gorduras=13.5, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Salmão Grelhado", porcao_padrao_g=100.0, calorias=208.0, proteinas=22.0, carboidratos=0.0, gorduras=13.0, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Maçã Fuji", porcao_padrao_g=100.0, calorias=52.0, proteinas=0.3, carboidratos=14.0, gorduras=0.2, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Iogurte Natural Desnatado", porcao_padrao_g=170.0, calorias=70.0, proteinas=6.8, carboidratos=10.0, gorduras=0.0, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Castanha-do-Pará", porcao_padrao_g=20.0, calorias=131.0, proteinas=2.9, carboidratos=2.4, gorduras=13.3, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Whey Protein 80%", porcao_padrao_g=30.0, calorias=120.0, proteinas=24.0, carboidratos=2.0, gorduras=1.8, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Tapioca Goma", porcao_padrao_g=50.0, calorias=120.0, proteinas=0.0, carboidratos=30.0, gorduras=0.0, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Pasta de Amendoim", porcao_padrao_g=15.0, calorias=90.0, proteinas=4.0, carboidratos=3.0, gorduras=7.5, origem_dados="tabela_padrao"),
                Alimento(nome_alimento="Carne Bovina Moída (Patinho)", porcao_padrao_g=100.0, calorias=133.0, proteinas=21.5, carboidratos=0.0, gorduras=4.5, origem_dados="tabela_padrao"),
            ]
            db.bulk_save_objects(alimentos_iniciais)
            db.commit()
            print("[Database] 18 alimentos padrão cadastrados com sucesso.")
except Exception as _e:
    print(f"[Database] Aviso ao inicializar banco: {_e}")
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    data_error_handler,
    operational_error_handler,
)
from app.api import auth_router, usuario_router, alimento_router, perfil_nutri_router
from app.api import meta_nutri_router, registro_agua_router, refeicao_router
from app.api import historico_progresso_router, fatsecret_router, sugestao_router, lembrete_router
from app.api import dashboard_router
from app.api import relatorio_router

app = FastAPI(
    title="KaorCount API",
    description="API REST do aplicativo mobile de nutrição KaorCount",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [
    auth_router, usuario_router, alimento_router, perfil_nutri_router,
    meta_nutri_router, registro_agua_router, refeicao_router,
    historico_progresso_router, fatsecret_router, sugestao_router, lembrete_router,
    dashboard_router, relatorio_router,
]:
    app.include_router(router, prefix=settings.API_V1_PREFIX)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(DataError, data_error_handler)
app.add_exception_handler(OperationalError, operational_error_handler)


@app.get("/")
def root():
    return {"projeto": "KaorCount", "versao": "1.0.0", "documentacao": "/docs", "prefixo_api": settings.API_V1_PREFIX}


@app.get("/health")
def health():
    return {"status": "ok"}
