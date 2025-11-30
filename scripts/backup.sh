#!/bin/bash
# Sauvegarde locale MongoDB (dump compressé)
# Usage: ./scripts/backup.sh

set -e

DB_NAME="${MONGODB_DB:-chefetoile}"
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/$DB_NAME}"
STAMP=$(date +"%Y%m%d_%H%M%S")
OUT_DIR="backups/mongo_$STAMP"

mkdir -p "$(dirname "$OUT_DIR")"

echo "🚀 Backup MongoDB $DB_NAME -> $OUT_DIR"
mongodump --uri "$MONGO_URI" --out "$OUT_DIR"
echo "✅ Backup terminé : $OUT_DIR"
