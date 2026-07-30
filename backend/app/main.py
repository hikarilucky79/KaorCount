from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, OperationalError, DataError

from app.core.config import settings
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    data_error_handler,
    operational_error_handler,
)
from app.api.auth_router import router as auth_router
from app.api.usuario_router import router as usuario_router
from app.api.alimento_router import router as alimento_router
from app.api.perfil_nutri_router import router as perfil_nutri_router
from app.api.meta_nutri_router import router as meta_nutri_router
from app.api.registro_agua_router import router as registro_agua_router
from app.api.refeicao_router import router as refeicao_router
from app.api.historico_progresso_router import router as historico_router

app = FastAPI(
    title="KaorCount API",
    description="""
## KaorCount — API REST do Aplicativo de Nutrição

### Funcionalidades (RF)
- **RF01**: Cadastro e autenticação de usuários com perfil personalizado
- **RF02**: Registro diário de refeições com busca em base de alimentos
- **RF03**: Cálculo automático de macronutrientes e calorias
- **RF04**: Definição de metas nutricionais diárias
- **RF05**: Dashboard com resumo de macros por dia
- **RF06**: Histórico alimentar com filtros por período
- **RF07**: Sugestões de refeições (planejado)

### Segurança (RNF02)
- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Conformidade com LGPD
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Equipe Keenko",
        "url": "https://github.com/hikarilucky79/KaorCount",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(usuario_router, prefix=settings.API_V1_PREFIX)
app.include_router(alimento_router, prefix=settings.API_V1_PREFIX)
app.include_router(perfil_nutri_router, prefix=settings.API_V1_PREFIX)
app.include_router(meta_nutri_router, prefix=settings.API_V1_PREFIX)
app.include_router(registro_agua_router, prefix=settings.API_V1_PREFIX)
app.include_router(refeicao_router, prefix=settings.API_V1_PREFIX)
app.include_router(historico_router, prefix=settings.API_V1_PREFIX)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(DataError, data_error_handler)
app.add_exception_handler(OperationalError, operational_error_handler)


@app.get("/")
def root():
    return {
        "projeto": "KaorCount",
        "versao": "1.0.0",
        "documentacao": "/docs",
        "prefixo_api": settings.API_V1_PREFIX,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
