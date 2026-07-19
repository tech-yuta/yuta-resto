#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${POS_BACKUP_DIR:?POS_BACKUP_DIR must be an absolute backup directory}"

case "$POS_BACKUP_DIR" in
  /*) ;;
  *)
    echo "POS_BACKUP_DIR must be absolute." >&2
    exit 1
    ;;
esac

if [ "$POS_BACKUP_DIR" = "/" ] || [ "$POS_BACKUP_DIR" = "${HOME:-}" ]; then
  echo "Refusing unsafe POS_BACKUP_DIR: $POS_BACKUP_DIR" >&2
  exit 1
fi

POSTGRES_NETWORK="${POSTGRES_NETWORK:-postgres_default}"
POS_BACKUP_RETENTION_DAYS="${POS_BACKUP_RETENTION_DAYS:-14}"

case "$POS_BACKUP_RETENTION_DAYS" in
  *[!0-9]*|'')
    echo "POS_BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
    exit 1
    ;;
esac

mkdir -p "$POS_BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$POS_BACKUP_DIR/yuta-pos-$timestamp.dump"
partial_file="$backup_file.partial"

cleanup_partial() {
  rm -f -- "$partial_file"
}

trap cleanup_partial EXIT HUP INT TERM

docker run --rm \
  --network "$POSTGRES_NETWORK" \
  --env DATABASE_URL \
  postgres:17-alpine \
  pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges \
  > "$partial_file"

mv -- "$partial_file" "$backup_file"
backup_name="$(basename "$backup_file")"
(
  cd "$POS_BACKUP_DIR"
  sha256sum "$backup_name" > "$backup_name.sha256"
)
trap - EXIT HUP INT TERM

find "$POS_BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'yuta-pos-*.dump' -o -name 'yuta-pos-*.dump.sha256' \) \
  -mtime "+$POS_BACKUP_RETENTION_DAYS" -delete

echo "Backup created: $backup_file"
