from fastapi import FastAPI

from app.core.config import settings

app = FastAPI(
    title="KaorCount API",
    description="API REST do aplicativo mobile de nutrição KaorCount",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


@app.get("/")
def root():
    return {
        "projeto": "KaorCount",
        "versao": "1.0.0",
        "documentacao": "/docs",
        "prefixo_api": settings.API_V1_PREFIX,
    }
