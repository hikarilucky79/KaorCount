from fastapi import APIRouter, Response
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/app", tags=["Versão do app"])


class VersaoApp(BaseModel):
    versao_atual: str
    versao_minima: str
    url_download: str


@router.get("/versao", response_model=VersaoApp)
def versao_do_app(response: Response):
    """Pública de propósito: o app consulta ao abrir, antes de qualquer login."""
    response.headers["Cache-Control"] = "public, max-age=300"
    return VersaoApp(
        versao_atual=settings.APP_VERSAO_ATUAL,
        versao_minima=settings.APP_VERSAO_MINIMA,
        url_download=settings.APP_URL_DOWNLOAD,
    )
