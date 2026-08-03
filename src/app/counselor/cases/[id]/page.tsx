import { notFound } from "next/navigation";
import { getCaseWorkspace } from "../../case-workspace-actions";
import { CaseWorkspaceClient } from "./CaseWorkspaceClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ruang Kerja Kasus BK" };

export default async function CaseWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getCaseWorkspace(id);
  if (!record) notFound();
  return <CaseWorkspaceClient record={record} />;
}
