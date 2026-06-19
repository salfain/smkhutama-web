"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

export function PiketDateFilter({ currentDate: propDate }: { currentDate?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDate = propDate ?? searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (nextDate) params.set("date", nextDate); else params.delete("date");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-sm w-fit">
      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Tanggal:</span>
      <input
        type="date"
        value={currentDate}
        onChange={handleDateChange}
        className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none cursor-pointer"
      />
    </div>
  );
}
