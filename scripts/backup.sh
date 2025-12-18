#!/bin/sh
# AccrediFy Backup Script (Linux/macOS)
#
# Supports:
# - Docker Compose backups (recommended): database + media volume
# - Local backups: database (requires pg_dump) + backend/media folder
#
# Usage:
#   ./scripts/backup.sh --docker
#   ./scripts/backup.sh --local
#
# Env (optional):
#   BACKUP_DIR=./backups
#   BACKUP_RETENTION_DAYS=14
#   DB_NAME / DB_USER / DB_PASSWORD (for docker mode uses root .env by default)

set -eu

MODE="${1:---docker}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TS="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

load_root_env() {
  if [ -f ".env" ]; then
    # shellcheck disable=SC1091
    set -a && . ./.env && set +a
  fi
}

dc_exec() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

backup_db_docker() {
  load_root_env
  : "${DB_PASSWORD:?DB_PASSWORD must be set (in .env or environment)}"
  DB_NAME="${DB_NAME:-accredify_db}"
  DB_USER="${DB_USER:-accredify_user}"

  OUT="${BACKUP_DIR}/db_${TS}.sql.gz"
  echo "[INFO] Backing up Postgres (docker) -> ${OUT}"
  dc_exec exec -T db sh -c "PGPASSWORD=\"${DB_PASSWORD}\" pg_dump -U \"${DB_USER}\" \"${DB_NAME}\"" | gzip > "$OUT"
}

backup_media_docker() {
  OUT="${BACKUP_DIR}/media_${TS}.tar.gz"
  echo "[INFO] Backing up media volume (docker) -> ${OUT}"
  # media is a named volume mounted at /app/media in backend container
  dc_exec exec -T backend sh -c "test -d /app/media && tar -czf - /app/media" > "$OUT" || {
    echo "[WARN] Media backup failed (no media volume yet?)"
  }
}

backup_db_local() {
  : "${DB_PASSWORD:?DB_PASSWORD must be set in environment for --local mode}"
  DB_NAME="${DB_NAME:-accredify_db}"
  DB_USER="${DB_USER:-accredify_user}"
  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-5432}"

  OUT="${BACKUP_DIR}/db_${TS}.sql.gz"
  echo "[INFO] Backing up Postgres (local) -> ${OUT}"
  PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$OUT"
}

backup_media_local() {
  OUT="${BACKUP_DIR}/media_${TS}.tar.gz"
  if [ -d "backend/media" ]; then
    echo "[INFO] Backing up backend/media -> ${OUT}"
    tar -czf "$OUT" backend/media
  else
    echo "[WARN] backend/media not found; skipping media backup"
  fi
}

apply_retention() {
  echo "[INFO] Applying retention: delete backups older than ${RETENTION_DAYS} days"
  find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -name "*.gz" -delete 2>/dev/null || true
  find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -name "*.sql" -delete 2>/dev/null || true
}

case "$MODE" in
  --docker)
    backup_db_docker
    backup_media_docker
    apply_retention
    ;;
  --local)
    backup_db_local
    backup_media_local
    apply_retention
    ;;
  *)
    echo "Usage: $0 [--docker|--local]"
    exit 2
    ;;
esac

echo "[INFO] Backup complete: ${BACKUP_DIR}"



