-- Biodata Buku Siswa (BK): diisi siswa, diverifikasi guru BK.

CREATE TYPE "StudentProfileStatus" AS ENUM ('DRAFT', 'PENDING', 'VERIFIED', 'REJECTED');

ALTER TABLE "students"
    ADD COLUMN "birth_place" TEXT,
    ADD COLUMN "birth_date" TIMESTAMP(3),
    ADD COLUMN "address" TEXT,
    ADD COLUMN "parent_phone" TEXT,
    ADD COLUMN "photo_url" TEXT,
    ADD COLUMN "medical_history" TEXT,
    ADD COLUMN "profile_status" "StudentProfileStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "profile_submitted_at" TIMESTAMP(3),
    ADD COLUMN "profile_verified_at" TIMESTAMP(3),
    ADD COLUMN "profile_verified_by_id" TEXT,
    ADD COLUMN "profile_note" TEXT;

ALTER TABLE "students"
    ADD CONSTRAINT "students_profile_verified_by_id_fkey"
    FOREIGN KEY ("profile_verified_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "students_profile_status_idx" ON "students"("profile_status");
