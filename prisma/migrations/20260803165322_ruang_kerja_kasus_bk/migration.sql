-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CounselingSessionMode" AS ENUM ('INDIVIDUAL', 'GROUP', 'PARENT', 'TEACHER', 'ONLINE');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PLANNED', 'SENT', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "counseling_cases" ADD COLUMN     "next_follow_up_at" TIMESTAMP(3),
ADD COLUMN     "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "risk_level" "RiskLevel" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "risk_notes" TEXT;

-- CreateTable
CREATE TABLE "counseling_sessions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "mode" "CounselingSessionMode" NOT NULL DEFAULT 'INDIVIDUAL',
    "location" TEXT,
    "summary" TEXT NOT NULL,
    "intervention" TEXT,
    "outcome" TEXT,
    "next_plan" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_referrals" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "referred_to" TEXT NOT NULL,
    "institution" TEXT,
    "contact" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PLANNED',
    "referred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "follow_up_at" TIMESTAMP(3),
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counseling_sessions_case_id_session_date_idx" ON "counseling_sessions"("case_id", "session_date");

-- CreateIndex
CREATE INDEX "counseling_referrals_case_id_status_idx" ON "counseling_referrals"("case_id", "status");

-- CreateIndex
CREATE INDEX "counseling_cases_status_priority_next_follow_up_at_idx" ON "counseling_cases"("status", "priority", "next_follow_up_at");

-- AddForeignKey
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "counseling_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_referrals" ADD CONSTRAINT "counseling_referrals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "counseling_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_referrals" ADD CONSTRAINT "counseling_referrals_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "lesson_schedules_academic_year_id_class_id_day_of_week_start_ti" RENAME TO "lesson_schedules_academic_year_id_class_id_day_of_week_star_key";

-- RenameIndex
ALTER INDEX "lesson_schedules_academic_year_id_teacher_id_day_of_week_start_" RENAME TO "lesson_schedules_academic_year_id_teacher_id_day_of_week_st_key";
