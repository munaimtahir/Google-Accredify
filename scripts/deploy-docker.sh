#!/bin/sh
# AccrediFy Docker deployment script (Linux/macOS)
#
# Modes:
#   --dev   : db + backend + frontend (Vite dev server)
#   --prod  : db + backend + nginx (+redis) using built ./dist
#
# Usage:
#   ./scripts/deploy-docker.sh --dev
#   ./scripts/deploy-docker.sh --prod
#
# Requirements:
# - Docker + Docker Compose
# - For --prod: Node/npm available to build ./dist (or provide prebuilt dist and use --skip-frontend)

set -eu

MODE="${1:---prod}"
SKIP_FRONTEND="${SKIP_FRONTEND:-0}"

dc() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

require_env() {
  if [ ! -f ".env" ]; then
    echo "[ERROR] .env not found. Copy .env.example -> .env and set DB_PASSWORD + DJANGO_SECRET_KEY."
    exit 1
  fi

  # shellcheck disable=SC1091
  set -a && . ./.env && set +a

  : "${DB_PASSWORD:?DB_PASSWORD is required in .env}"
  : "${DJANGO_SECRET_KEY:?DJANGO_SECRET_KEY is required in .env}"
}

build_frontend() {
  if [ "$SKIP_FRONTEND" = "1" ]; then
    echo "[INFO] SKIP_FRONTEND=1 set; skipping frontend build"
    return
  fi
  echo "[INFO] Building frontend (npm ci && npm run build)"
  npm ci
  npm run build
}

deploy_dev() {
  require_env
  echo "[INFO] Starting dev stack: db + backend + frontend"
  dc up -d --build db backend frontend
  echo "[INFO] Running migrations + collectstatic"
  dc exec -T backend python manage.py migrate --noinput
  dc exec -T backend python manage.py collectstatic --noinput
  echo "[INFO] Done. Frontend: http://localhost:3000  Backend: http://localhost:8000/api/health/"
}

deploy_prod() {
  require_env
  build_frontend
  echo "[INFO] Starting prod stack: db + backend + nginx (+redis)"
  dc up -d --build db backend
  dc --profile production up -d --build nginx redis || dc --profile production up -d --build nginx
  echo "[INFO] Running migrations + collectstatic"
  dc exec -T backend python manage.py migrate --noinput
  dc exec -T backend python manage.py collectstatic --noinput
  echo "[INFO] Done. Nginx: http://localhost  API: http://localhost/api/health/"
}

case "$MODE" in
  --dev) deploy_dev ;;
  --prod) deploy_prod ;;
  *)
    echo "Usage: $0 [--dev|--prod] (env: SKIP_FRONTEND=1)"
    exit 2
    ;;
esac



