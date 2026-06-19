import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { Clock3, Database, Search, ShieldCheck, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log" };

type SearchParams = {
  q?: string;
  action?: string;
  entity?: string;
};

function formatAction(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function prettyDetails(details: string | null) {
  if (!details) return null;
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
}

function toDateTime(value: Date) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditLogsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  await requireAuth("ADMIN");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const action = params.action?.trim() ?? "ALL";
  const entity = params.entity?.trim() ?? "ALL";

  const where = {
    ...(action !== "ALL" ? { action } : {}),
    ...(entity !== "ALL" ? { entity } : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" as const } },
            { entity: { contains: q, mode: "insensitive" as const } },
            { entityId: { contains: q, mode: "insensitive" as const } },
            { details: { contains: q, mode: "insensitive" as const } },
            { ipAddress: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [logs, actionOptions, entityOptions, totalLogs] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true },
    }),
    prisma.auditLog.findMany({
      where: { entity: { not: null } },
      distinct: ["entity"],
      orderBy: { entity: "asc" },
      select: { entity: true },
    }),
    prisma.auditLog.count(),
  ]);

  const userIds = [...new Set(logs.map((log) => log.userId).filter((id): id is string => Boolean(id)))];
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true, role: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500">Riwayat aksi penting pengguna di sistem</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">Total Log</p>
            <p className="text-xl font-bold text-gray-900">{totalLogs}</p>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500">Ditampilkan</p>
            <p className="text-xl font-bold text-blue-600">{logs.length}</p>
          </div>
        </div>
      </div>

      <form className="mb-6 rounded-xl border bg-white p-4 shadow-sm" action="/admin/audit-logs">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Cari aksi, modul, id, detail, atau IP..."
              className="h-10 pl-9"
            />
          </div>
          <select
            name="action"
            defaultValue={action}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm text-gray-700"
          >
            <option value="ALL">Semua Aksi</option>
            {actionOptions.map((item) => (
              <option key={item.action} value={item.action}>{formatAction(item.action)}</option>
            ))}
          </select>
          <select
            name="entity"
            defaultValue={entity}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm text-gray-700"
          >
            <option value="ALL">Semua Modul</option>
            {entityOptions.map((item) => (
              <option key={item.entity ?? ""} value={item.entity ?? ""}>{item.entity}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit" className="h-10 bg-blue-600 hover:bg-blue-700">Filter</Button>
            <Button asChild type="button" variant="outline" className="h-10">
              <a href="/admin/audit-logs">Reset</a>
            </Button>
          </div>
        </div>
      </form>

      {logs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Belum ada audit log</p>
          <p className="mt-1 text-xs text-gray-500">Log akan muncul setelah pengguna melakukan aksi yang dicatat sistem.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const user = log.userId ? userMap.get(log.userId) : null;
            const details = prettyDetails(log.details);

            return (
              <div key={log.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {formatAction(log.action)}
                      </Badge>
                      {log.entity && (
                        <Badge variant="secondary" className="gap-1">
                          <Database className="h-3 w-3" />
                          {log.entity}
                        </Badge>
                      )}
                      {log.entityId && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-500">
                          {log.entityId}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-3">
                      <div className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">
                          {user ? `${user.name} (${user.role})` : log.userId ? `User ${log.userId.slice(0, 8)}` : "Sistem / tidak diketahui"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-gray-400" />
                        <span>{toDateTime(log.createdAt)}</span>
                      </div>
                      <div className="truncate">IP: {log.ipAddress ?? "-"}</div>
                    </div>
                    {details && (
                      <details className="mt-3 rounded-lg border bg-gray-50 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-600">Lihat detail</summary>
                        <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
                          {details}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
