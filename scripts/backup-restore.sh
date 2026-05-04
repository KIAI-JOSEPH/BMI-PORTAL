#!/bin/sh
# BMI UMS - Database Backup & Restore
# Uses Litestream (Apache 2.0) for continuous SQLite replication
# https://litestream.io

set -e

COMMAND=${1:-help}
PB_DATA="./data/pb_data"

case "$COMMAND" in
  backup)
    echo "Creating manual backup snapshot..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="./backups/$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    # Use SQLite's online backup API via sqlite3 (safe while PocketBase is running)
    sqlite3 "$PB_DATA/data.db" ".backup '$BACKUP_DIR/data.db'"
    sqlite3 "$PB_DATA/auxiliary.db" ".backup '$BACKUP_DIR/auxiliary.db'" 2>/dev/null || true
    echo "Backup saved to: $BACKUP_DIR"
    ;;

  restore)
    BACKUP_PATH=${2:-}
    if [ -z "$BACKUP_PATH" ]; then
      echo "Usage: $0 restore <backup_dir>"
      echo "Example: $0 restore ./backups/20240101_120000"
      exit 1
    fi
    echo "WARNING: This will overwrite the current database!"
    echo "Stop PocketBase first, then press Enter to continue..."
    read -r
    cp "$BACKUP_PATH/data.db" "$PB_DATA/data.db"
    cp "$BACKUP_PATH/auxiliary.db" "$PB_DATA/auxiliary.db" 2>/dev/null || true
    echo "Restore complete. Start PocketBase to verify."
    ;;

  list)
    echo "Available backups:"
    ls -la ./backups/ 2>/dev/null || echo "No backups found in ./backups/"
    ;;

  litestream-restore)
    # Restore from Litestream S3 replica
    REPLICA_URL=${2:-s3://bmi-ums-backup/pocketbase/data.db}
    echo "Restoring from Litestream replica: $REPLICA_URL"
    docker run --rm \
      -v "$(pwd)/data/pb_data:/pb_data" \
      -e LITESTREAM_ACCESS_KEY_ID="$LITESTREAM_ACCESS_KEY_ID" \
      -e LITESTREAM_SECRET_ACCESS_KEY="$LITESTREAM_SECRET_ACCESS_KEY" \
      litestream/litestream restore \
      -replica s3 /pb_data/data.db
    echo "Litestream restore complete."
    ;;

  help|*)
    echo "BMI UMS Database Backup & Restore"
    echo ""
    echo "Commands:"
    echo "  backup                    Create a manual backup snapshot"
    echo "  restore <backup_dir>      Restore from a manual backup"
    echo "  list                      List available backups"
    echo "  litestream-restore [url]  Restore from Litestream S3 replica"
    ;;
esac
