import time
import httpx

from app.core.config import settings


class FatAuthService:
    TOKEN_URL = "https://oauth.fatsecret.com/connect/token"

    _token: str | None = None
    _expira_em: float = 0

    @classmethod
    def get_token(cls) -> str:
        if cls._token and time.time() < cls._expira_em - 60:
            return cls._token

        response = httpx.post(
            cls.TOKEN_URL,
            data={"grant_type": "client_credentials", "scope": "basic"},
            auth=(settings.FATSECRET_CLIENT_ID, settings.FATSECRET_CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        cls._token = data["access_token"]
        cls._expira_em = time.time() + data.get("expires_in", 86400)
        return cls._token
