CREATE TABLE "teaching_assignments" (
    "id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "weekly_periods" INTEGER NOT NULL,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teaching_assignments_academic_year_id_teacher_id_subject_id_class_id_key"
ON "teaching_assignments"("academic_year_id", "teacher_id", "subject_id", "class_id");

CREATE INDEX "teaching_assignments_academic_year_id_class_id_idx"
ON "teaching_assignments"("academic_year_id", "class_id");

CREATE INDEX "teaching_assignments_academic_year_id_teacher_id_idx"
ON "teaching_assignments"("academic_year_id", "teacher_id");

ALTER TABLE "teaching_assignments"
ADD CONSTRAINT "teaching_assignments_academic_year_id_fkey"
FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teaching_assignments"
ADD CONSTRAINT "teaching_assignments_teacher_id_fkey"
FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teaching_assignments"
ADD CONSTRAINT "teaching_assignments_subject_id_fkey"
FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teaching_assignments"
ADD CONSTRAINT "teaching_assignments_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
