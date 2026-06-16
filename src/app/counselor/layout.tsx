import { CounselorSidebar } from "@/components/layouts/CounselorSidebar";
import { requireCounselorAuth } from "@/lib/session";

export default async function CounselorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCounselorAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <CounselorSidebar user={{ name: user.name }} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
