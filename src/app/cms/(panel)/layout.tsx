import { CmsSidebar } from "@/components/layouts/CmsSidebar";
import { requireCmsAuth } from "@/lib/session";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCmsAuth();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <CmsSidebar name={user.name} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
