import { TeacherSidebar } from "@/components/layouts/TeacherSidebar";
import { requireAuth } from "@/lib/session";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("TEACHER");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <TeacherSidebar user={{
        name: user.name,
        subjectName: user.teacher?.subject?.name ?? null,
      }} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
