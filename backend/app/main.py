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
    # Em produção: sem docs, sem redoc, sem schema público
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)


# CORS.
# Desenvolvimento (padrão): liberado para qualquer origem, como antes.
# Produção: só os domínios listados em CORS_ORIGINS. Sem essa trava, qualquer
# site poderia chamar a API com o token do usuário logado.
_origens = settings.cors_origins_list

if settings.is_production and not _origens:
    raise RuntimeError(
        "[CORS] CORS_ORIGINS vazio em produção. Defina os domínios separados por "
        'vírgula, ex.: CORS_ORIGINS="https://kaorcount.com.br"'
    )

if not _origens:
    print("[CORS] Modo desenvolvimento: allow_origins=['*']")
else:
    print(f"[CORS] Origens permitidas: {_origens}")

app.add_middleware(
    CORSMiddleware,
    # Com allow_credentials=True o navegador exige uma origem explícita;
    # "*" seria rejeitado, então usamos a lista configurada.
    allow_origins=_origens if _origens else ["*"],
    allow_credentials=bool(_origens),
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
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

# Servir arquivos estáticos (CSS e JS).
# Na Vercel o public/ é promovido ao CDN e não acompanha o bundle da função, e
# um StaticFiles de diretório ausente derruba o import inteiro. Onde os arquivos
# existem (Docker) o mount acontece; onde não existem, o CDN já atende a rota.
for _prefixo in ("css", "js"):
    _pasta = PUBLIC_DIR / _prefixo
    if _pasta.is_dir():
        app.mount(f"/{_prefixo}", StaticFiles(directory=_pasta), name=_prefixo)

# Raiz e /index.html — só quando o HTML está no bundle. Na Vercel o vercel.json
# reescreve "/" para /html/index.html, servido direto do CDN.
if INDEX_HTML.is_file():
    @app.get("/", include_in_schema=False)
    @app.get("/index.html", include_in_schema=False)
    def root():
        return FileResponse(INDEX_HTML)

@app.get("/health")
def health():
    return {"status": "ok"}
