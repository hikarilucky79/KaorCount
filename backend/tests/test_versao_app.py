import os
from tempfile import TemporaryDirectory
from pathlib import Path

import pytest

# A aplicação cria tabelas no import: nunca apontar a coleta de testes ao banco real.
_banco_importacao = TemporaryDirectory(prefix="kaorcount-test-versao-")
os.environ["DATABASE_URL"] = "sqlite:///" + (Path(_banco_importacao.name) / "import.db").as_posix()
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "chave-apenas-para-testes-kaorcount-123456"

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import engine as engine_importacao


@pytest.fixture(scope="module", autouse=True)
def limpar_banco_importacao():
    yield
    engine_importacao.dispose()
    _banco_importacao.cleanup()


def test_versao_e_publica_e_reflete_a_configuracao(monkeypatch):
    monkeypatch.setattr(settings, "APP_VERSAO_ATUAL", "1.4.0")
    monkeypatch.setattr(settings, "APP_VERSAO_MINIMA", "1.2.0")
    monkeypatch.setattr(settings, "APP_URL_DOWNLOAD", "/downloads/KaorCount-android.apk")
    with TestClient(app) as cliente:
        resposta = cliente.get("/api/v1/app/versao")
    assert resposta.status_code == 200, resposta.text
    assert resposta.json() == {
        "versao_atual": "1.4.0",
        "versao_minima": "1.2.0",
        "url_download": "/downloads/KaorCount-android.apk",
    }
    assert "max-age" in resposta.headers["cache-control"]
