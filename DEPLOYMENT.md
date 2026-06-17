# Panduan Deploy & Operasional — CBT SMK HUTAMA

Panduan ini untuk VPS Ubuntu (sudah berjalan di `43.133.134.10`).

---

## 1. HTTPS (Domain + SSL Let's Encrypt)

Prasyarat: punya domain yang sudah diarahkan (A record) ke IP VPS, mis. `cbt.smkhutama.sch.id`.

```bash
# 1. Install certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 2. Pastikan blok server nginx memakai server_name domain kamu
#    (edit /etc/nginx/sites-available/cbt-smkhutama → server_name cbt.smkhutama.sch.id;)
sudo nginx -t && sudo systemctl reload nginx

# 3. Terbitkan sertifikat SSL (otomatis mengubah konfig nginx ke HTTPS)
sudo certbot --nginx -d cbt.smkhutama.sch.id

# 4. Uji perpanjangan otomatis (certbot sudah pasang timer otomatis)
sudo certbot renew --dry-run
```

Setelah HTTPS aktif, aktifkan cookie secure di `.env` aplikasi:

```bash
cd /var/www/cbt-smkhutama
nano .env          # tambahkan / ubah baris berikut:
# COOKIE_SECURE="true"
npm run build
pm2 restart cbt-smkhutama
```

> Selama masih HTTP (akses lewat IP), biarkan `COOKIE_SECURE="false"`.

---

## 2. Backup Database Otomatis

Script: `scripts/backup-db.sh` (sudah ada di repo).

```bash
# 1. Beri izin eksekusi
cd /var/www/cbt-smkhutama
chmod +x scripts/backup-db.sh

# 2. Simpan password DB agar pg_dump tidak minta password (file ~/.pgpass)
#    format: host:port:db:user:password
echo "localhost:5432:db_cbt_smk_hutama:cbt_user:SmkHutama2026" >> ~/.pgpass
chmod 600 ~/.pgpass

# 3. Uji jalankan manual
./scripts/backup-db.sh
# Hasil tersimpan di /var/backups/cbt/

# 4. Jadwalkan via cron (tiap hari pukul 02:00)
crontab -e
# tambahkan baris:
# 0 2 * * * /var/www/cbt-smkhutama/scripts/backup-db.sh >> /var/log/cbt-backup.log 2>&1
```

Restore dari backup:

```bash
gunzip -c /var/backups/cbt/cbt_db_cbt_smk_hutama_YYYYMMDD_HHMMSS.sql.gz | psql -U cbt_user -h localhost db_cbt_smk_hutama
```

Tips: salin file backup ke penyimpanan lain (Google Drive / rclone / S3) secara berkala agar aman bila VPS bermasalah.

---

## Update Aplikasi (setiap ada perubahan)

```bash
cd /var/www/cbt-smkhutama
git pull
npx prisma generate
npx prisma db push      # hanya jika ada perubahan skema database
npm run build
pm2 restart cbt-smkhutama
```
