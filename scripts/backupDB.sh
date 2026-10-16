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

# 1. SQL Dump
echo "1. Generating SQL dump..."
docker compose exec -T db mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_DIR/db_${MYSQL_DATABASE}_${TIMESTAMP}.sql" 2>/dev/null || \
docker compose exec -T db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_DIR/db_${MYSQL_DATABASE}_${TIMESTAMP}.sql"

echo "   ✅ SQL dump created: $BACKUP_DIR/db_${MYSQL_DATABASE}_${TIMESTAMP}.sql"

# 2. Docker Volume tarball
echo "2. Creating raw Docker volume archive..."
VOLUME_NAME=$(docker volume ls -q | grep "db_data" | head -n 1)

if [ -n "$VOLUME_NAME" ]; then
  docker run --rm \
    -v "$VOLUME_NAME":/volume:ro \
    -v "$(pwd)/$BACKUP_DIR":/backup \
    alpine tar -czf "/backup/docker_volume_${VOLUME_NAME}_${TIMESTAMP}.tar.gz" -C /volume .
  echo "   ✅ Volume archive created: $BACKUP_DIR/docker_volume_${VOLUME_NAME}_${TIMESTAMP}.tar.gz"
else
  echo "   ⚠️ Could not automatically detect volume name matching 'db_data'."
fi

echo "========================================"
echo "Backup completed successfully!"
echo "Files stored in: $(pwd)/$BACKUP_DIR"
echo "========================================"
