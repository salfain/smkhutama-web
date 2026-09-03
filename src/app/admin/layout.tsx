import { AdminSidebar } from "@/components/layouts/AdminSidebar";
import { requireAdminArea } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminArea();

  return (
    <div className="genesis-app flex h-screen overflow-hidden bg-[#FAFAFA] dark:bg-[#111113]">
      <AdminSidebar user={{ name: user.name, username: user.username, email: user.email, role: user.role }} />
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col pb-24 lg:pb-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
