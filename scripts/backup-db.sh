#!/usr/bin/env bash
# ============================================================
# Backup otomatis database PostgreSQL CBT SMK HUTAMA
# Jalankan via cron harian. Menyimpan 14 backup terakhir.
# ============================================================
set -euo pipefail

# --- Konfigurasi (sesuaikan bila perlu) ---
DB_NAME="${DB_NAME:-db_cbt_smk_hutama}"
DB_USER="${DB_USER:-cbt_user}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/cbt}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

# --- Proses ---
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_DIR}/cbt_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Memulai backup ${DB_NAME}..."
# PGPASSWORD bisa di-set lewat environment, atau pakai ~/.pgpass
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$FILE"

echo "[$(date)] Backup selesai: ${FILE} ($(du -h "$FILE" | cut -f1))"

# Hapus backup lebih lama dari RETENTION_DAYS hari
find "$BACKUP_DIR" -name "cbt_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] Backup lama (> ${RETENTION_DAYS} hari) dibersihkan."
