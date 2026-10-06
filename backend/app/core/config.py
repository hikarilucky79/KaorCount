from pydantic import model_validator
from pydantic_settings import BaseSettings

# Valor padrão que vem no código. Fica exposto para que a trava de produção
# compare contra a mesma string em um lugar só.
SECRET_KEY_PADRAO = "trocar-esta-chave-em-producao"

# HS256 com chave curta é brute-forceável; 32 caracteres é o mínimo aceito aqui.
SECRET_KEY_MINIMO = 32


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:senha@localhost:3306/kaorcount"
    SECRET_KEY: str = SECRET_KEY_PADRAO
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

    @model_validator(mode="after")
    def _travar_chave_em_producao(self) -> "Settings":
        # A SECRET_KEY assina todos os tokens JWT: com a chave padrão — pública
        # no repositório — qualquer um forja token de qualquer usuário. Roda na
        # carga das settings, antes de conectar no banco, para o erro vir claro.
        if self.is_production and (
            not self.SECRET_KEY
            or self.SECRET_KEY == SECRET_KEY_PADRAO
            or len(self.SECRET_KEY) < SECRET_KEY_MINIMO
        ):
            raise ValueError(
                "SECRET_KEY inválida em produção: defina uma chave própria de "
                "pelo menos "
                f"{SECRET_KEY_MINIMO} caracteres, ex.: python -c \"import "
                "secrets; print(secrets.token_urlsafe(48))\""
            )
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
