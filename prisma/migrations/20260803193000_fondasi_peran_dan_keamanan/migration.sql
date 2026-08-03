-- Fondasi lintas modul: penugasan, capability, notifikasi, audit akses sensitif,
-- dan pengaitan catatan operasional dengan tahun ajaran.

CREATE TYPE "AssignmentType" AS ENUM (
  'KURIKULUM', 'KESISWAAN', 'ADMIN_CBT', 'COUNSELOR', 'PIKET',
  'HOMEROOM_TEACHER', 'STUDENT_ADVISOR', 'OSIS_ADVISOR',
  'EXTRACURRICULAR_ADVISOR', 'HEAD_OF_PROGRAM', 'PKL_ADVISOR',
  'BKK', 'LSP', 'SAFE_SCHOOL_TEAM', 'CMS', 'PPDB', 'LEADERSHIP', 'FACILITIES'
);

CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ACTION_REQUIRED');
CREATE TYPE "SensitiveAccessAction" AS ENUM ('VIEW', 'PRINT', 'EXPORT');

CREATE TABLE "user_assignments" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "AssignmentType" NOT NULL,
  "academic_year_id" TEXT,
  "class_id" TEXT,
  "major_id" TEXT,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "note" TEXT,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_permissions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  "allowed" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMP(3),
  "granted_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'INFO',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "href" TEXT,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sensitive_access_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "action" "SensitiveAccessAction" NOT NULL DEFAULT 'VIEW',
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "purpose" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sensitive_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_assignments_user_id_type_is_active_idx" ON "user_assignments"("user_id", "type", "is_active");
CREATE INDEX "user_assignments_academic_year_id_idx" ON "user_assignments"("academic_year_id");
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
CREATE INDEX "user_permissions_user_id_allowed_idx" ON "user_permissions"("user_id", "allowed");
CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_key" ON "user_permissions"("user_id", "permission_id");
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");
CREATE INDEX "sensitive_access_logs_user_id_created_at_idx" ON "sensitive_access_logs"("user_id", "created_at");
CREATE INDEX "sensitive_access_logs_resource_type_resource_id_idx" ON "sensitive_access_logs"("resource_type", "resource_id");

ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_assignments" ADD CONSTRAINT "user_assignments_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sensitive_access_logs" ADD CONSTRAINT "sensitive_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Kolom periode ditambahkan nullable dahulu agar data lama dapat dibackfill.
ALTER TABLE "counseling_cases" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "violation_records" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "achievement_records" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "counseling_requests" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "parent_summons" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "home_visits" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "surveys" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "piket_schedules" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "student_tardiness" ADD COLUMN "academic_year_id" TEXT;
ALTER TABLE "student_permits" ADD COLUMN "academic_year_id" TEXT;

-- Bila instalasi lama punya catatan operasional tetapi belum punya tahun ajaran,
-- buat satu periode historis agar migrasi tidak membuang data.
INSERT INTO "academic_years" ("id", "year", "semester", "is_active", "created_at", "updated_at")
SELECT 'foundation-historical-year', 'Data Historis', 'GANJIL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "academic_years")
  AND (
    EXISTS (SELECT 1 FROM "counseling_cases") OR
    EXISTS (SELECT 1 FROM "violation_records") OR
    EXISTS (SELECT 1 FROM "achievement_records") OR
    EXISTS (SELECT 1 FROM "counseling_requests") OR
    EXISTS (SELECT 1 FROM "parent_summons") OR
    EXISTS (SELECT 1 FROM "home_visits") OR
    EXISTS (SELECT 1 FROM "surveys") OR
    EXISTS (SELECT 1 FROM "piket_schedules") OR
    EXISTS (SELECT 1 FROM "teacher_attendances") OR
    EXISTS (SELECT 1 FROM "student_tardiness") OR
    EXISTS (SELECT 1 FROM "student_permits")
  );

UPDATE "counseling_cases" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "violation_records" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "achievement_records" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "counseling_requests" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "parent_summons" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "home_visits" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "surveys" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "piket_schedules" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "teacher_attendances" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "student_tardiness" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);
UPDATE "student_permits" SET "academic_year_id" = (SELECT "id" FROM "academic_years" ORDER BY "is_active" DESC, "created_at" DESC LIMIT 1);

ALTER TABLE "counseling_cases" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "violation_records" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "achievement_records" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "counseling_requests" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "parent_summons" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "home_visits" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "surveys" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "piket_schedules" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "teacher_attendances" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "student_tardiness" ALTER COLUMN "academic_year_id" SET NOT NULL;
ALTER TABLE "student_permits" ALTER COLUMN "academic_year_id" SET NOT NULL;

ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "violation_records" ADD CONSTRAINT "violation_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "achievement_records" ADD CONSTRAINT "achievement_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "counseling_requests" ADD CONSTRAINT "counseling_requests_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parent_summons" ADD CONSTRAINT "parent_summons_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "piket_schedules" ADD CONSTRAINT "piket_schedules_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_tardiness" ADD CONSTRAINT "student_tardiness_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_permits" ADD CONSTRAINT "student_permits_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "piket_schedules_teacher_id_day_of_week_key";
CREATE UNIQUE INDEX "piket_schedules_academic_year_id_teacher_id_day_of_week_key" ON "piket_schedules"("academic_year_id", "teacher_id", "day_of_week");

-- Capability awal. Role tetap memberi default; tabel ini menampung override.
INSERT INTO "permissions" ("id", "key", "name", "description", "category", "updated_at") VALUES
  ('perm-foundation-manage', 'foundation.manage', 'Kelola Fondasi', 'Mengelola fondasi akses sistem', 'Sistem', CURRENT_TIMESTAMP),
  ('perm-assignments-manage', 'assignments.manage', 'Kelola Penugasan', 'Menambah dan mengubah penugasan pengguna', 'Sistem', CURRENT_TIMESTAMP),
  ('perm-permissions-manage', 'permissions.manage', 'Kelola Permission', 'Memberi atau mencabut capability pengguna', 'Sistem', CURRENT_TIMESTAMP),
  ('perm-notifications-send', 'notifications.send', 'Kirim Notifikasi', 'Mengirim notifikasi internal', 'Komunikasi', CURRENT_TIMESTAMP),
  ('perm-audit-view', 'audit.view', 'Lihat Audit', 'Melihat audit aktivitas sistem', 'Sistem', CURRENT_TIMESTAMP),
  ('perm-bk-sensitive-view', 'bk.sensitive.view', 'Lihat Data Rahasia BK', 'Membuka catatan konseling rahasia', 'BK', CURRENT_TIMESTAMP),
  ('perm-bk-sensitive-print', 'bk.sensitive.print', 'Cetak Data Rahasia BK', 'Mencetak dokumen konseling rahasia', 'BK', CURRENT_TIMESTAMP),
  ('perm-bk-sensitive-export', 'bk.sensitive.export', 'Ekspor Data Rahasia BK', 'Mengekspor data konseling rahasia', 'BK', CURRENT_TIMESTAMP),
  ('perm-curriculum-manage', 'curriculum.manage', 'Kelola Kurikulum', 'Mengelola data dan proses kurikulum', 'Kurikulum', CURRENT_TIMESTAMP),
  ('perm-student-affairs-manage', 'student_affairs.manage', 'Kelola Kesiswaan', 'Mengelola data dan proses kesiswaan', 'Kesiswaan', CURRENT_TIMESTAMP),
  ('perm-cbt-manage', 'cbt.manage', 'Kelola CBT', 'Mengelola ujian berbasis komputer', 'CBT', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
