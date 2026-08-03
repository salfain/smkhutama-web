CREATE TABLE "lesson_schedules" (
    "id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "room" TEXT,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lesson_schedules_academic_year_id_class_id_day_of_week_start_time_key"
ON "lesson_schedules"("academic_year_id", "class_id", "day_of_week", "start_time");

CREATE UNIQUE INDEX "lesson_schedules_academic_year_id_teacher_id_day_of_week_start_time_key"
ON "lesson_schedules"("academic_year_id", "teacher_id", "day_of_week", "start_time");

CREATE INDEX "lesson_schedules_class_id_day_of_week_idx"
ON "lesson_schedules"("class_id", "day_of_week");

CREATE INDEX "lesson_schedules_teacher_id_day_of_week_idx"
ON "lesson_schedules"("teacher_id", "day_of_week");

ALTER TABLE "lesson_schedules"
ADD CONSTRAINT "lesson_schedules_academic_year_id_fkey"
FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lesson_schedules"
ADD CONSTRAINT "lesson_schedules_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lesson_schedules"
ADD CONSTRAINT "lesson_schedules_subject_id_fkey"
FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lesson_schedules"
ADD CONSTRAINT "lesson_schedules_teacher_id_fkey"
FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
