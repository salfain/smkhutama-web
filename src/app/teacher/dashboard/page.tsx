import { requireAuth } from "@/lib/session";
import { getTeacherDashboard } from "./actions";
import { TeacherDashboardClient } from "./TeacherDashboardClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Guru" };

export default async function TeacherDashboard() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) redirect("/login");

  const data = await getTeacherDashboard(user.teacher.id).catch(() => null);

  return (
    <TeacherDashboardClient
      teacherName={user.name}
      subjectName={user.teacher.subject?.name ?? "Belum ditentukan"}
      data={data}
    />
  );
}
