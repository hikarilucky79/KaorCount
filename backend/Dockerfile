# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────
# KaorCount — imagem da API REST (FastAPI)
# Contexto de build: ./backend
# ─────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS base

# Evita emojis/acentos quebrados nos logs do container e buffering do stdout.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONIOENCODING=UTF-8 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependências de sistema necessárias para wheels nativos
# (cryptography / reportlab / uvicorn[standard]).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        gcc \
        libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Camada de dependências: cacheada enquanto o requirements.txt não muda.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Código da aplicação.
COPY . .

# Usuário sem privilégios.
RUN useradd --create-home --uid 1000 kaorcount \
    && chown -R kaorcount:kaorcount /app
USER kaorcount

EXPOSE 8000

# O healthcheck usa o próprio /health exposto pela API (sem depender de curl
# no host). Uvicorn com 1 worker para não duplicar conexões do pool MySQL.
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
