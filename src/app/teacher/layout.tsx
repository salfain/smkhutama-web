import { TeacherSidebar } from "@/components/layouts/TeacherSidebar";
import { requireAuth } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("TEACHER");

  return (
    <div className="genesis-app flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#111113]">
      <TeacherSidebar user={{
        name: user.name,
        subjectName: user.teacher?.subject?.name ?? null,
      }} />
      <main className="flex-1 overflow-y-auto flex flex-col pb-24 lg:pb-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
