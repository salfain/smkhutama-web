-- Tambahkan peran admin baru (operasi aditif, data lama tetap utuh).
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KURIKULUM';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KESISWAAN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN_CBT';

-- ViolationRecord: isi pencatat baru dari akun User milik Counselor lama
-- sebelum kolom dan foreign key lama dihapus.
ALTER TABLE "violation_records" ADD COLUMN "recorded_by_id" TEXT;

UPDATE "violation_records" vr
SET "recorded_by_id" = c."user_id"
FROM "counselors" c
WHERE vr."counselor_id" = c."id";

-- Berhenti bila ada catatan yang konselornya sudah tidak memiliki akun.
ALTER TABLE "violation_records" ALTER COLUMN "recorded_by_id" SET NOT NULL;

ALTER TABLE "violation_records" DROP CONSTRAINT IF EXISTS "violation_records_counselor_id_fkey";
ALTER TABLE "violation_records" DROP COLUMN "counselor_id";
ALTER TABLE "violation_records"
  ADD CONSTRAINT "violation_records_recorded_by_id_fkey"
  FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id");

-- AchievementRecord: lakukan urutan aman yang sama.
ALTER TABLE "achievement_records" ADD COLUMN "recorded_by_id" TEXT;

UPDATE "achievement_records" ar
SET "recorded_by_id" = c."user_id"
FROM "counselors" c
WHERE ar."counselor_id" = c."id";

ALTER TABLE "achievement_records" ALTER COLUMN "recorded_by_id" SET NOT NULL;

ALTER TABLE "achievement_records" DROP CONSTRAINT IF EXISTS "achievement_records_counselor_id_fkey";
ALTER TABLE "achievement_records" DROP COLUMN "counselor_id";
ALTER TABLE "achievement_records"
  ADD CONSTRAINT "achievement_records_recorded_by_id_fkey"
  FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id");
