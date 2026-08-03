import { AdminSidebar } from "@/components/layouts/AdminSidebar";
import { requireAdminArea } from "@/lib/session";
import { PageTransition } from "@/components/PageTransition";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminArea();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <AdminSidebar user={{ name: user.name, username: user.username, email: user.email, role: user.role }} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
