from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:senha@localhost:3306/kaorcount"
    SECRET_KEY: str = "trocar-esta-chave-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    API_V1_PREFIX: str = "/api/v1"
    FATSECRET_CLIENT_ID: str = ""
    FATSECRET_CLIENT_SECRET: str = ""

    # ── Produção ────────────────────────────────────────────────────
    # "development" (padrão) mantém o fallback automático para SQLite,
    # útil para rodar a API sem MySQL na máquina.
    # "production" faz a API RECUSAR subir se o MySQL estiver inacessível,
    # evitando o modo silencioso que perde dados a cada deploy.
    ENVIRONMENT: str = "development"
    APP_ENV: str = ""  # alias legado de ENVIRONMENT

    # Domínios permitidos no CORS, separados por vírgula.
    # Vazio = modo desenvolvimento (libera tudo, como antes).
    # Em produção, ex.: "https://kaorcount.com.br,https://www.kaorcount.com.br"
    CORS_ORIGINS: str = ""

    @property
    def is_production(self) -> bool:
        return (self.ENVIRONMENT or self.APP_ENV).strip().lower() in {
            "production", "prod", "producao",
        }

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
