"use client";

export function FullScreenLoader({ message = "Memuat...", accent = "blue" }: { message?: string; accent?: "blue" | "purple" }) {
  const ring = accent === "purple" ? "border-t-purple-600" : "border-t-blue-600";
  const text = accent === "purple" ? "text-purple-600" : "text-blue-600";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/school/logo"
            alt="Logo"
            className="h-14 w-14 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-gray-200 dark:border-slate-700" />
          <div className={`absolute inset-0 h-10 w-10 rounded-full border-4 border-transparent ${ring} animate-spin`} />
        </div>
        <p className={`text-sm font-medium ${text} animate-pulse`}>{message}</p>
      </div>
    </div>
  );
}
