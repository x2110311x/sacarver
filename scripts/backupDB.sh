#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "========================================"
echo "Backing up Sacarver MariaDB Database"
echo "========================================"

OUTPUT_FILE="$BACKUP_DIR/db_${MYSQL_DATABASE}_${TIMESTAMP}.sql"

# Generate SQL Dump using mariadb-dump with mysqldump fallback
docker compose exec -T db mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$OUTPUT_FILE" 2>/dev/null || \
docker compose exec -T db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$OUTPUT_FILE"

echo "✅ SQL dump successfully created: $OUTPUT_FILE"
echo "========================================"
