# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────
# KaorCount — build do bundle web (Expo / React Native Web)
# Contexto de build: . (raiz do projeto)
#
# O app mobile (iOS/Android) NÃO roda dentro de containers — ele é compilado
# pelo Expo/EAS. O que o Docker empacota aqui é o mesmo bundle web gerado por
# `npx expo export --platform web`, servido de forma estática pelo nginx.
# Para testar em celular, use `npm start` + Expo Go (ver README).
# ─────────────────────────────────────────────────────────────────────

# ── Estágio 1: dependências ──────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copia os manifestos para aproveitar o cache de camadas do Docker.
# O package-lock.json é versionado, então "npm ci" instala exatamente as
# versões travadas — mais rápido e reproduzível como "npm install".
COPY package.json package-lock.json* ./

# Se o lock não existir (clone antigo), cai para npm install.
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      echo "AVISO: package-lock.json ausente; usando npm install."; \
      npm install --no-audit --no-fund; \
    fi

# ── Estágio 2: build do bundle web ───────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# URL da API injetada no bundle em tempo de build.
# Vazio = mantém o auto-detect de src/api/client.js (localhost:8000 no browser).
# Em produção, aponte para o host público da API, ex.: https://api.kaorcount.com/api/v1
ARG EXPO_PUBLIC_API_URL=""
# Credenciais Auth0 (opcional). Vazios = mantém o login legado (JWT local).
ARG EXPO_PUBLIC_AUTH0_DOMAIN=""
ARG EXPO_PUBLIC_AUTH0_CLIENT_ID=""
ARG EXPO_PUBLIC_AUTH0_AUDIENCE=""

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_AUTH0_DOMAIN=$EXPO_PUBLIC_AUTH0_DOMAIN \
    EXPO_PUBLIC_AUTH0_CLIENT_ID=$EXPO_PUBLIC_AUTH0_CLIENT_ID \
    EXPO_PUBLIC_AUTH0_AUDIENCE=$EXPO_PUBLIC_AUTH0_AUDIENCE \
    EXPO_NO_TELEMETRY=1 \
    CI=1

# Gera a versão estática do app em ./dist
RUN npx expo export --platform web --output-dir dist --clear

# ── Estágio 3: servidor estático ─────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="KaorCount Web" \
      org.opencontainers.image.description="Bundle web do app de nutrição KaorCount (Keenko)"

# Configuração do nginx (SPA fallback + proxy reverso para a API).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Artefatos do build do Expo.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
