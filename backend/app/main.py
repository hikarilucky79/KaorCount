from fastapi import FastAPI

from app.core.config import settings
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
    description="API REST do aplicativo mobile de nutrição KaorCount",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(usuario_router, prefix=settings.API_V1_PREFIX)
app.include_router(alimento_router, prefix=settings.API_V1_PREFIX)
app.include_router(perfil_nutri_router, prefix=settings.API_V1_PREFIX)
app.include_router(meta_nutri_router, prefix=settings.API_V1_PREFIX)
app.include_router(registro_agua_router, prefix=settings.API_V1_PREFIX)
app.include_router(refeicao_router, prefix=settings.API_V1_PREFIX)
app.include_router(historico_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "projeto": "KaorCount",
        "versao": "1.0.0",
        "documentacao": "/docs",
        "prefixo_api": settings.API_V1_PREFIX,
    }
