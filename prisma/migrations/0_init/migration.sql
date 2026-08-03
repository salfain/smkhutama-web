-- Baseline skema lengkap sebelum migrasi pemindahan pencatat ke User.
-- Database lama menandai migrasi ini sebagai applied; database baru menjalankannya.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'LANDING_ADMIN', 'COUNSELOR', 'PIKET', 'KURIKULUM', 'KESISWAAN', 'ADMIN_CBT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'MULTIPLE_CHOICE_COMPLEX', 'TRUE_FALSE', 'MATCHING', 'SHORT_ANSWER', 'ESSAY');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('NONE', 'IMAGE', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('UH', 'UTS', 'UAS', 'US', 'TRYOUT', 'LAINNYA');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('GANJIL', 'GENAP');

-- CreateEnum
CREATE TYPE "CounselingType" AS ENUM ('PRIBADI', 'SOSIAL', 'BELAJAR', 'KARIR');

-- CreateEnum
CREATE TYPE "CounselingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REFERRED');

-- CreateEnum
CREATE TYPE "ViolationCategory" AS ENUM ('RINGAN', 'SEDANG', 'BERAT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'SCHEDULED', 'DONE', 'REJECTED');

-- CreateEnum
CREATE TYPE "SummonStatus" AS ENUM ('PENDING', 'SENT', 'DONE');

-- CreateEnum
CREATE TYPE "QuestionSetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'USED');

-- CreateEnum
CREATE TYPE "QuestionSetSource" AS ENUM ('TEACHER_IMPORT', 'ADMIN_IMPORT');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'VERIFIED', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "school_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "npsn" TEXT,
    "principal_name" TEXT,
    "letterhead" TEXT,
    "digital_signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "majors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "homeroom_teacher_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "major_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nis" TEXT,
    "nisn" TEXT,
    "class_id" TEXT,
    "major_id" TEXT,
    "gender" "Gender",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nip" TEXT,
    "subject_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_sets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject_id" TEXT NOT NULL,
    "owner_teacher_id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "created_by_role" "Role" NOT NULL DEFAULT 'TEACHER',
    "source" "QuestionSetSource" NOT NULL DEFAULT 'TEACHER_IMPORT',
    "exam_type" "ExamType" NOT NULL DEFAULT 'UTS',
    "grade" TEXT,
    "source_file_name" TEXT,
    "status" "QuestionSetStatus" NOT NULL DEFAULT 'DRAFT',
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "multiple_choice_count" INTEGER NOT NULL DEFAULT 0,
    "essay_count" INTEGER NOT NULL DEFAULT 0,
    "invalid_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "question_set_id" TEXT,
    "question_type" "QuestionType" NOT NULL,
    "question_text" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL DEFAULT 'NONE',
    "media_url" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "score_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "material" TEXT,
    "competency" TEXT,
    "grade" TEXT,
    "is_randomized" BOOLEAN NOT NULL DEFAULT true,
    "randomize_options" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_label" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "media_url" TEXT,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "question_set_id" TEXT,
    "academic_year_id" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "requested_question_count" INTEGER,
    "requested_multiple_choice_count" INTEGER,
    "requested_essay_count" INTEGER,
    "multiple_choice_percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "essay_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "randomize_questions" BOOLEAN NOT NULL DEFAULT false,
    "randomize_options" BOOLEAN NOT NULL DEFAULT false,
    "show_result" BOOLEAN NOT NULL DEFAULT false,
    "show_explanation" BOOLEAN NOT NULL DEFAULT false,
    "passing_score" DOUBLE PRECISION,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "exam_type" "ExamType" NOT NULL DEFAULT 'UH',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_classes" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,

    CONSTRAINT "exam_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_sessions" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "session_name" TEXT NOT NULL,
    "room_name" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_tokens" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_exam_attempts" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" DOUBLE PRECISION,
    "login_status" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "lock_reason" TEXT,
    "violation_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_answers" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT,
    "answer_text" TEXT,
    "is_doubtful" BOOLEAN NOT NULL DEFAULT false,
    "is_correct" BOOLEAN,
    "score" DOUBLE PRECISION,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entity_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_profiles" (
    "id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL DEFAULT 'SMK Hutama Pondok Gede',
    "short_name" TEXT NOT NULL DEFAULT 'SMK Hutama',
    "tagline" TEXT,
    "logo_url" TEXT,
    "hero_badge" TEXT,
    "hero_title" TEXT,
    "hero_subtitle" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "official_url" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "youtube" TEXT,
    "ppdb_open" BOOLEAN NOT NULL DEFAULT true,
    "vision" TEXT,
    "mission" TEXT,
    "history" TEXT,
    "principal_name" TEXT,
    "principal_photo" TEXT,
    "principal_word" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_hero_images" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "order_number" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_hero_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_stats" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "landing_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_majors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "landing_majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_news" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_teachers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "subject" TEXT,
    "photo_url" TEXT,
    "order_number" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_extracurriculars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "schedule" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Sparkles',
    "color" TEXT NOT NULL DEFAULT 'from-blue-500 to-indigo-600',
    "image_url" TEXT,
    "order_number" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_extracurriculars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "regist_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "nisn" TEXT,
    "gender" "Gender",
    "birth_place" TEXT,
    "birth_date" TIMESTAMP(3),
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "parent_name" TEXT,
    "parent_phone" TEXT,
    "origin_school" TEXT,
    "selected_major" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_gallery" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "order_number" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nip" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ViolationCategory" NOT NULL DEFAULT 'RINGAN',
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "violation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_cases" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "type" "CounselingType" NOT NULL DEFAULT 'PRIBADI',
    "status" "CounselingStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "session_notes" TEXT,
    "follow_up" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT true,
    "session_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "violation_type_id" TEXT,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "sanction" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'SEDANG',
    "preferred_date" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_summons" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "meeting_date" TIMESTAMP(3),
    "status" "SummonStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_summons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_visits" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL,
    "address" TEXT,
    "findings" TEXT,
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT,
    "order_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piket_schedules" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "piket_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_attendances" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "period" TEXT,
    "substitute" TEXT,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_tardiness" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "sanction" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_tardiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_permits" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "exit_time" TIMESTAMP(3),
    "return_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'KELUAR',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_permits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "majors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_nis_key" ON "students"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "students_nisn_key" ON "students"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_nip_key" ON "teachers"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_exam_id_question_id_key" ON "exam_questions"("exam_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_classes_exam_id_class_id_key" ON "exam_classes"("exam_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_tokens_token_key" ON "exam_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "student_exam_attempts_exam_id_student_id_key" ON "student_exam_attempts"("exam_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_attempt_id_question_id_key" ON "student_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "landing_news_slug_key" ON "landing_news"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_regist_number_key" ON "registrations"("regist_number");

-- CreateIndex
CREATE UNIQUE INDEX "counselors_user_id_key" ON "counselors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "counselors_nip_key" ON "counselors"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_survey_id_student_id_key" ON "survey_responses"("survey_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answers_response_id_question_id_key" ON "survey_answers"("response_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "piket_schedules_teacher_id_day_of_week_key" ON "piket_schedules"("teacher_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroom_teacher_id_fkey" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_owner_teacher_id_fkey" FOREIGN KEY ("owner_teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_classes" ADD CONSTRAINT "exam_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_tokens" ADD CONSTRAINT "exam_tokens_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_exam_attempts" ADD CONSTRAINT "student_exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_exam_attempts" ADD CONSTRAINT "student_exam_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "student_exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselors" ADD CONSTRAINT "counselors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_cases" ADD CONSTRAINT "counseling_cases_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_records" ADD CONSTRAINT "violation_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_records" ADD CONSTRAINT "violation_records_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_records" ADD CONSTRAINT "violation_records_violation_type_id_fkey" FOREIGN KEY ("violation_type_id") REFERENCES "violation_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_records" ADD CONSTRAINT "achievement_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_records" ADD CONSTRAINT "achievement_records_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_requests" ADD CONSTRAINT "counseling_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_summons" ADD CONSTRAINT "parent_summons_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_summons" ADD CONSTRAINT "parent_summons_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piket_schedules" ADD CONSTRAINT "piket_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_tardiness" ADD CONSTRAINT "student_tardiness_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_permits" ADD CONSTRAINT "student_permits_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
