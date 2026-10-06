#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# KaorCount — script de lançamento via Docker (Linux/macOS/WSL)
#
#   ./run.sh          → sobe a stack de desenvolvimento (build se necessário)
#   ./run.sh prod     → sobe a stack de PRODUÇÃO (Caddy + HTTPS + travas)
#   ./run.sh build    → apenas constrói as imagens
#   ./run.sh up       → sobe sem rebuild
#   ./run.sh down     → derruba (mantém o banco)
#   ./run.sh reset    → derruba e APAGA o banco
#   ./run.sh logs     → acompanha os logs
#   ./run.sh status   → mostra o estado dos containers
#   ./run.sh check    → valida a configuração de produção
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERRO: Docker não encontrado. Instale em https://docs.docker.com/get-docker/"
  exit 1
fi

# Usa "docker compose" (v2) ou "docker-compose" (v1), o que existir.
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERRO: Docker Compose não encontrado."
  exit 1
fi

# Em produção, o compose de desenvolvimento é sobreposto pelo de produção.
# O .env.prod é passado via --env-file para que o Compose NÃO leia o .env
# de desenvolvimento (e nem as variáveis exportadas no shell).
PROD_FILES="--env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml"
ENV_PROD=".env.prod"
COMANDO="${1:-up}"

# ─── Verificação da configuração de produção ─────────────────────────
checar_producao() {
  local ok=1
  if [ ! -f "$ENV_PROD" ]; then
    echo "ERRO: arquivo $ENV_PROD não encontrado."
    echo "      cp .env.prod.example $ENV_PROD   e edite os valores."
    exit 1
  fi
  for var in SECRET_KEY DB_PASSWORD DB_ROOT_PASSWORD CORS_ORIGINS CADDY_DOMAIN ACME_EMAIL; do
    if ! grep -qE "^${var}=.+" "$ENV_PROD"; then
      echo "ERRO: variável $var vazia ou ausente no $ENV_PROD."
      ok=0
    fi
  done
  if grep -qE "^SECRET_KEY=(trocar-esta-chave-em-producao|COLOQUE_AQUI|chave-insegura)" "$ENV_PROD"; then
    echo "ERRO: SECRET_KEY ainda é o valor de exemplo."
    echo "      Gere uma: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
    ok=0
  fi
  if grep -qE "^EXPO_PUBLIC_(SECRET|DB_|PASSWORD|TOKEN)" "$ENV_PROD"; then
    echo "ERRO: há um segredo com prefixo EXPO_PUBLIC_ no $ENV_PROD."
    echo "      Isso embute o valor no bundle do navegador e vira público."
    ok=0
  fi
  if [ "$ok" -eq 1 ]; then
    echo "Configuração de produção OK ($ENV_PROD)."
  else
    exit 1
  fi
}

case "$COMANDO" in
  build)
    $COMPOSE build
    ;;
  prod)
    checar_producao
    $COMPOSE $PROD_FILES up -d --build
    echo ""
    echo "======================================================="
    echo " KaorCount em PRODUÇÃO no ar!"
    echo "======================================================="
    echo " Domínio ......... https://\$(grep '^CADDY_DOMAIN=' $ENV_PROD | cut -d= -f2)"
    echo " Documentação .... https://\$(grep '^CADDY_DOMAIN=' $ENV_PROD | cut -d= -f2)/docs"
    echo "======================================================="
    echo " O certificado HTTPS é emitido na primeira subida (~15s)."
    echo " Acompanhe com: $COMPOSE $PROD_FILES logs -f"
    ;;
  check)
    checar_producao
    $COMPOSE $PROD_FILES config --quiet && echo "docker-compose.prod.yml válido."
    ;;
  up)
    $COMPOSE up -d --build
    echo ""
    echo "======================================================="
    echo " KaorCount no ar!"
    echo "======================================================="
    echo " App ............ http://localhost:${WEB_PORT:-8080}"
    echo " API (Swagger) .. http://localhost:${API_PORT:-8000}/docs"
    echo " Health check ... http://localhost:${API_PORT:-8000}/health"
    echo " MySQL ......... localhost:${DB_PORT:-3306}"
    echo "======================================================="
    echo " Acompanhe com: $COMPOSE logs -f"
    ;;
  down)
    $COMPOSE $PROD_FILES down
    ;;
  reset)
    echo "ATENÇÃO: isso apaga o banco de dados de produção."
    read -r -p "Digite SIM para confirmar: " confirmacao
    if [ "$confirmacao" = "SIM" ]; then
      $COMPOSE $PROD_FILES down -v
      echo "Containers e banco de dados removidos."
    else
      echo "Cancelado."
    fi
    ;;
  logs)
    $COMPOSE $PROD_FILES logs -f
    ;;
  status)
    $COMPOSE $PROD_FILES ps
    ;;
  *)
    echo "Uso: ./run.sh [prod|build|up|down|reset|logs|status|check]"
    exit 1
    ;;
esac
