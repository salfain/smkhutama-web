"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, CheckCheck, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ACTION_REQUIRED";
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const typeStyles = {
  INFO: { icon: Info, className: "bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text" },
  SUCCESS: { icon: CircleCheck, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" },
  WARNING: { icon: TriangleAlert, className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" },
  ACTION_REQUIRED: { icon: CircleAlert, className: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300" },
};

function relativeTime(date: string) {
  const elapsed = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export function NotificationCenter({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { items: NotificationItem[]; unreadCount: number };
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markRead(id: string) {
    const wasUnread = items.some((item) => item.id === id && !item.readAt);
    if (!wasUnread) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  async function markAllRead() {
    if (!unreadCount) return;
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { setOpen(next); if (next) void load(); }}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex h-9 items-center justify-center rounded-md text-[#6B6B6B] transition-colors hover:bg-[#F5F5F7] hover:text-[#0A0A0A] dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]",
            compact ? "w-9" : "mb-1 w-full justify-start gap-2.5 border border-[#E8E8EC] px-3 text-xs font-medium dark:border-white/10",
            className,
          )}
          title="Notifikasi"
        >
          {unreadCount > 0 ? <BellRing className="h-3.5 w-3.5 text-brand-text" /> : <Bell className="h-3.5 w-3.5 text-[#9C9C9C]" />}
          {!compact && <span>Notifikasi</span>}
          {unreadCount > 0 && <span className={cn("rounded-full bg-red-500 px-1.5 text-[9px] font-bold leading-[17px] text-white", compact ? "absolute -right-1 -top-1 min-w-[17px]" : "ml-auto min-w-[17px] text-center")}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[92vw] gap-0 sm:max-w-md" side="right">
        <SheetHeader className="border-b border-[#E8E8EC] pr-12 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div><SheetTitle>Notifikasi</SheetTitle><SheetDescription>Informasi terbaru untuk akun Anda.</SheetDescription></div>
            {unreadCount > 0 && <Button size="sm" variant="ghost" onClick={markAllRead}><CheckCheck className="h-3.5 w-3.5" /> Tandai semua</Button>}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          {loading && items.length === 0 && <p className="py-10 text-center text-sm text-gray-400">Memuat notifikasi...</p>}
          {!loading && items.length === 0 && <div className="py-14 text-center"><Bell className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" /><p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">Belum ada notifikasi</p><p className="mt-1 text-xs text-gray-400">Informasi baru akan tampil di sini.</p></div>}
          <div className="space-y-2">
            {items.map((item) => {
              const style = typeStyles[item.type];
              const Icon = style.icon;
              const content = (
                <div className="flex gap-3">
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.className)}><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><div className="flex items-start gap-2"><p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>{!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}</div><p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-500 dark:text-gray-400">{item.message}</p><p className="mt-2 text-[10px] text-gray-400">{relativeTime(item.createdAt)}</p></div>
                </div>
              );
              const cardClass = cn("block w-full rounded-lg border p-3 text-left transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]", item.readAt ? "border-[#E8E8EC] bg-white dark:border-white/10 dark:bg-transparent" : "border-brand-soft bg-brand-soft dark:border-brand/20 dark:bg-brand/[0.04]");
              return item.href ? <Link key={item.id} href={item.href} onClick={() => { void markRead(item.id); setOpen(false); }} className={cardClass}>{content}</Link> : <button key={item.id} type="button" onClick={() => void markRead(item.id)} className={cardClass}>{content}</button>;
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
