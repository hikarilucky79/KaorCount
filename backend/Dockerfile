# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────
# KaorCount — imagem única: API REST (FastAPI) + site estático (public/)
# Contexto de build: ./backend
# ─────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONIOENCODING=UTF-8 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Deps de sistema para wheels nativos (cryptography / reportlab / uvicorn[standard])
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        gcc \
        libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Dependências Python (cacheadas enquanto requirements.txt não muda)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Código da aplicação — inclui app/ e public/ (html, css, js)
COPY . .

# Usuário sem privilégios
RUN useradd --create-home --uid 1000 kaorcount \
    && chown -R kaorcount:kaorcount /app
USER kaorcount

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# Render injeta $PORT; local cai no 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
