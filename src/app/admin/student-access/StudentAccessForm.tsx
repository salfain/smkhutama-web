"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Globe, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { setStudentAccess, type StudentAccess } from "./actions";

const channels = [
  {
    key: "allow_student_web_login" as const,
    icon: Globe,
    title: "Lewat Website",
    description: "Siswa membuka halaman login di browser.",
    whenOff: "Siswa yang login di browser akan ditolak dan diminta memakai aplikasi.",
  },
  {
    key: "allow_student_mobile_login" as const,
    icon: Smartphone,
    title: "Lewat Aplikasi Mobile",
    description: "Siswa masuk dari aplikasi di HP.",
    whenOff: "Siswa yang login di aplikasi akan ditolak. Guru dan admin tidak terpengaruh.",
  },
];

export function StudentAccessForm({ access }: { access: StudentAccess }) {
  const [state, setState] = useState(access);
  const [pendingKey, setPendingKey] = useState<keyof StudentAccess | null>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  function toggle(key: keyof StudentAccess) {
    const next = !state[key];
    const previous = state[key];
    setState((current) => ({ ...current, [key]: next }));
    setPendingKey(key);
    setError("");

    startTransition(async () => {
      const result = await setStudentAccess(key, next);
      setPendingKey(null);
      if (result.error) {
        setState((current) => ({ ...current, [key]: previous }));
        setError(result.error);
      }
    });
  }

  const allClosed = !state.allow_student_web_login && !state.allow_student_mobile_login;

  return (
    <div className="max-w-3xl space-y-4">
      {channels.map((channel) => {
        const enabled = state[channel.key];
        const saving = pendingKey === channel.key;

        return (
          <section
            key={channel.key}
            className="rounded-xl border border-[#E8E8EC] bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-[#19191C]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    enabled
                      ? "bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text"
                      : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500",
                  )}
                >
                  <channel.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-heading font-semibold text-gray-900 dark:text-white">
                    {channel.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-400">{channel.description}</p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${channel.title}: ${enabled ? "aktif" : "nonaktif"}`}
                onClick={() => toggle(channel.key)}
                disabled={saving}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center self-start rounded-full transition-colors disabled:opacity-60 sm:self-center",
                  enabled ? "bg-brand" : "bg-gray-300 dark:bg-white/15",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    enabled ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            <p
              className={cn(
                "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm",
                enabled
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
              )}
            >
              {enabled ? (
                <>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Siswa bisa login lewat jalur ini.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{channel.whenOff}</span>
                </>
              )}
            </p>
          </section>
        );
      })}

      {allClosed && (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Kedua jalur mati — siswa tidak bisa masuk sama sekali. Aktifkan minimal satu sebelum
            ujian dimulai.
          </span>
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-400">Perubahan langsung tersimpan dan berlaku seketika.</p>
    </div>
  );
}
