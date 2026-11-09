import base64
import hashlib
import hmac
import secrets
import time
from collections.abc import Mapping
from urllib.parse import quote

from app.core.config import settings


class FatAuthService:
    # [F571] Codifica valores para compor os parâmetros assinados pelo OAuth 1.0.
    @staticmethod
    def _encode(value: str) -> str:
        return quote(value, safe="~-._")

    # [F197] Gera a assinatura OAuth 1.0 dos parâmetros enviados ao FatSecret.
    @classmethod
    def sign_params(
        cls,
        params: Mapping[str, str | int],
        request_url: str,
    ) -> dict[str, str | int]:
        consumer_key = settings.FATSECRET_CLIENT_ID
        consumer_secret = settings.FATSECRET_CLIENT_SECRET
        if not consumer_key or not consumer_secret:
            raise RuntimeError("Credenciais OAuth 1.0 do FatSecret não configuradas")

        oauth_params = {
            "oauth_consumer_key": consumer_key,
            "oauth_nonce": secrets.token_hex(16),
            "oauth_signature_method": "HMAC-SHA1",
            "oauth_timestamp": str(int(time.time())),
            "oauth_version": "1.0",
        }
        all_params = [
            (str(name), str(value))
            for name, value in (*params.items(), *oauth_params.items())
        ]
        encoded_params = sorted(
            (cls._encode(name), cls._encode(value))
            for name, value in all_params
        )
        normalized_params = "&".join(
            f"{name}={value}" for name, value in encoded_params
        )
        signature_base = "&".join(
            (
                "POST",
                cls._encode(request_url),
                cls._encode(normalized_params),
            )
        )
        signing_key = f"{cls._encode(consumer_secret)}&".encode("utf-8")
        digest = hmac.new(
            signing_key,
            signature_base.encode("utf-8"),
            hashlib.sha1,
        ).digest()
        oauth_params["oauth_signature"] = base64.b64encode(digest).decode("ascii")

        signed_params: dict[str, str | int] = dict(params)
        signed_params.update(oauth_params)
        return signed_params
