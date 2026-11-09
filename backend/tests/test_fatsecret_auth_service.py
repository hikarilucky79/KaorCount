import pytest

from app.core.config import settings
from app.services import fatsecret_service
from app.services.fatsecret_auth_service import FatAuthService


def test_sign_params_uses_fatsecret_oauth1_signature(monkeypatch):
    monkeypatch.setattr(settings, "FATSECRET_CLIENT_ID", "demo-key")
    monkeypatch.setattr(settings, "FATSECRET_CLIENT_SECRET", "demo-secret")
    monkeypatch.setattr("app.services.fatsecret_auth_service.time.time", lambda: 12345678)
    monkeypatch.setattr(
        "app.services.fatsecret_auth_service.secrets.token_hex",
        lambda _: "nonce123",
    )

    signed = FatAuthService.sign_params(
        {
            "method": "foods.search",
            "search_expression": "peanut butter & jam",
            "format": "json",
        },
        "https://platform.fatsecret.com/rest/server.api",
    )

    assert signed["oauth_consumer_key"] == "demo-key"
    assert signed["oauth_nonce"] == "nonce123"
    assert signed["oauth_signature_method"] == "HMAC-SHA1"
    assert signed["oauth_timestamp"] == "12345678"
    assert signed["oauth_version"] == "1.0"
    assert signed["oauth_signature"] == "1sh7UyIuCuD3PHTw3P7M0M4hGAY="


def test_fatsecret_request_sends_signed_params_without_bearer_token(monkeypatch):
    monkeypatch.setattr(settings, "FATSECRET_CLIENT_ID", "demo-key")
    monkeypatch.setattr(settings, "FATSECRET_CLIENT_SECRET", "demo-secret")
    monkeypatch.setattr("app.services.fatsecret_auth_service.time.time", lambda: 12345678)
    monkeypatch.setattr(
        "app.services.fatsecret_auth_service.secrets.token_hex",
        lambda _: "nonce123",
    )
    monkeypatch.setattr(fatsecret_service, "_fonte_externa_bloqueada_ate", 0.0)
    monkeypatch.setattr(fatsecret_service, "_fonte_externa_motivo", None)
    chamada = {}

    class Resposta:
        def raise_for_status(self):
            pass

        @staticmethod
        def json():
            return {"food": {"food_id": "123"}}

    def post(url, **kwargs):
        chamada["url"] = url
        chamada.update(kwargs)
        return Resposta()

    monkeypatch.setattr(fatsecret_service.httpx, "post", post)

    resultado = fatsecret_service.FatSecretService._request(
        {"method": "food.get.v4", "food_id": "123"}
    )

    assert resultado == {"food": {"food_id": "123"}}
    assert chamada["url"] == fatsecret_service.FatSecretService.API_URL
    assert chamada["data"]["oauth_signature_method"] == "HMAC-SHA1"
    assert chamada["data"]["oauth_signature"]
    assert "Authorization" not in chamada["headers"]


def test_sign_params_requires_both_credentials(monkeypatch):
    monkeypatch.setattr(settings, "FATSECRET_CLIENT_ID", "")
    monkeypatch.setattr(settings, "FATSECRET_CLIENT_SECRET", "")

    with pytest.raises(RuntimeError, match="Credenciais OAuth 1.0 do FatSecret não configuradas"):
        FatAuthService.sign_params({}, "https://platform.fatsecret.com/rest/server.api")
