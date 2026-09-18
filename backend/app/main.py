from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, OperationalError, DataError

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.models.alimento import Alimento
import app.models  # noqa: F401

# Cria as tabelas no banco de dados automaticamente se não existirem
try:
    Base.metadata.create_all(bind=engine)
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


PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"
INDEX_HTML = PUBLIC_DIR / "html" / "index.html"

# Servir arquivos estáticos (CSS e JS)
app.mount("/css", StaticFiles(directory=PUBLIC_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=PUBLIC_DIR / "js"), name="js")

# Rota para a raiz e para /index.html
@app.get("/", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
def root():
    return FileResponse(INDEX_HTML)

@app.get("/health")
def health():
    return {"status": "ok"}
