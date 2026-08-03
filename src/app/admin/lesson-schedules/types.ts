export type Schedule = {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  note: string | null;
  academicYear: { year: string; semester: "GANJIL" | "GENAP"; isActive: boolean };
  class: { name: string; grade: string };
  subject: { name: string; code: string };
  teacher: { user: { name: string } };
};

export type AcademicYear = {
  id: string;
  year: string;
  semester: "GANJIL" | "GENAP";
  isActive: boolean;
};

export type ClassOption = {
  id: string;
  name: string;
  grade: string;
  major: { code: string };
};

export type SubjectOption = { id: string; name: string; code: string };

export type TeacherOption = {
  id: string;
  user: { name: string };
  subject: { name: string; code: string } | null;
};

export type TeachingAssignmentOption = {
  id: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyPeriods: number;
};

export const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function yearLabel(year: AcademicYear) {
  return `${year.year} · ${year.semester === "GANJIL" ? "Ganjil" : "Genap"}${year.isActive ? " · Aktif" : ""}`;
}

export function shortTeacherName(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  return `${words[0]} ${words[words.length - 1]}`;
}
