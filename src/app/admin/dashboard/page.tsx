import { getDashboardStats, getChartData } from "./actions";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, charts] = await Promise.all([
    getDashboardStats().catch(() => null),
    getChartData().catch(() => null),
  ]);

  const fallback = {
    totalStudents: 0, totalTeachers: 0, totalClasses: 0,
    totalSubjects: 0, totalQuestions: 0, activeExams: 0,
    inProgressAttempts: 0, submittedAttempts: 0,
  };

  const s = stats ?? { ...fallback, schoolProfile: null, activeYear: null, recentExams: [] };

  const schoolName = s.schoolProfile?.name ?? "SMK HUTAMA";
  const activeYearStr = s.activeYear
    ? `TA ${s.activeYear.year} ${s.activeYear.semester === "GANJIL" ? "Ganjil" : "Genap"}`
    : "Tahun Ajaran Belum Diset";

  return (
    <DashboardClient
      stats={s}
      recentExams={s.recentExams ?? []}
      scoreChartData={charts?.scoreChartData ?? []}
      schoolName={schoolName}
      activeYear={activeYearStr}
    />
  );
}
