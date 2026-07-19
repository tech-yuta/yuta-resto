#!/bin/sh
set -eu

if [ "${1:-}" != "--confirm" ] || [ -z "${2:-}" ]; then
  echo "Usage: restore-db.sh --confirm /absolute/path/to/yuta-pos-*.dump" >&2
  exit 1
fi

: "${POS_RESTORE_DATABASE_URL:?POS_RESTORE_DATABASE_URL is required}"

backup_file="$2"

case "$backup_file" in
  /*) ;;
  *)
    echo "The backup path must be absolute." >&2
    exit 1
    ;;
esac

if [ ! -f "$backup_file" ]; then
  echo "Backup file not found: $backup_file" >&2
  exit 1
fi

checksum_file="$backup_file.sha256"
if [ -f "$checksum_file" ]; then
  (
    cd "$(dirname "$backup_file")"
    sha256sum --check "$(basename "$checksum_file")"
  )
else
  echo "Warning: checksum file not found; continuing with explicit confirmation." >&2
fi

POSTGRES_NETWORK="${POSTGRES_NETWORK:-postgres_default}"
backup_dir="$(dirname "$backup_file")"
backup_name="$(basename "$backup_file")"
docker_backup_dir="$backup_dir"

if [ -n "${MSYSTEM:-}" ] && command -v cygpath >/dev/null 2>&1; then
  docker_backup_dir="$(cygpath -w "$backup_dir")"
fi

echo "Restoring $backup_file into POS_RESTORE_DATABASE_URL."
echo "Existing objects in the target database may be replaced."

if [ -n "${MSYSTEM:-}" ]; then
  MSYS_NO_PATHCONV=1 docker run --rm \
    --network "$POSTGRES_NETWORK" \
    --env POS_RESTORE_DATABASE_URL \
    --volume "$docker_backup_dir:/backup:ro" \
    postgres:17-alpine \
    pg_restore \
      --dbname "$POS_RESTORE_DATABASE_URL" \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      "/backup/$backup_name"
else
  docker run --rm \
    --network "$POSTGRES_NETWORK" \
    --env POS_RESTORE_DATABASE_URL \
    --volume "$docker_backup_dir:/backup:ro" \
    postgres:17-alpine \
    pg_restore \
      --dbname "$POS_RESTORE_DATABASE_URL" \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      "/backup/$backup_name"
fi

echo "Restore completed. Run migrations and the POS acceptance checks next."
