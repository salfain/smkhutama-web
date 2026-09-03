import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GenesisDashboard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="genesis-dashboard min-h-full bg-[#FAFAFA] text-[#0A0A0A] dark:bg-[#111113] dark:text-[#F5F5F7]">
      <div className={cn("mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10", className)}>
        {children}
      </div>
    </div>
  );
}

export function DashboardHeader({
  eyebrow,
  title,
  description,
  meta,
  status,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-col gap-5 border-b border-[#E8E8EC] pb-8 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9C9C9C]">{eyebrow}</p>
        <h1 className="genesis-heading text-[32px] font-bold leading-[1.08] text-[#0A0A0A] dark:text-[#F5F5F7] sm:text-[40px]">
          {title}
        </h1>
        <div className="mt-3 max-w-2xl text-[15px] leading-6 text-[#6B6B6B] dark:text-[#A7A7AE]">{description}</div>
      </div>
      {(meta || status) && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{meta}{status}</div>}
    </header>
  );
}

export function DashboardPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const toneClass = {
    neutral: "border-[#E8E8EC] bg-[#FFFFFF] text-[#6B6B6B] dark:border-white/10 dark:bg-[#19191C] dark:text-[#A7A7AE]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
  }[tone];

  return <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium", toneClass)}>{children}</span>;
}

export function DashboardSectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="genesis-heading text-2xl font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-[#9C9C9C]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function DashboardMetric({
  icon: Icon,
  label,
  value,
  detail,
  href,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  detail?: string;
  href?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const iconTone = {
    neutral: "bg-[#F5F5F7] text-[#6B6B6B] dark:bg-white/5 dark:text-[#A7A7AE]",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  }[tone];

  const card = (
    <div className={cn(
      "h-full rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] p-4 shadow-none transition-all duration-200 dark:border-white/10 dark:bg-[#19191C] sm:p-5",
      href && "hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15 dark:hover:border-brand",
    )}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9C9C9C]">{label}</p>
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconTone)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <p className="genesis-heading text-[30px] font-semibold leading-none text-[#0A0A0A] dark:text-[#F5F5F7]">{value}</p>
      {detail && <p className="mt-2 truncate text-xs text-[#9C9C9C]" title={detail}>{detail}</p>}
    </div>
  );

  return href ? <Link href={href} className="block h-full rounded-xl">{card}</Link> : card;
}

export function DashboardPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("overflow-hidden rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] shadow-none dark:border-white/10 dark:bg-[#19191C]", className)}>{children}</section>;
}

export function DashboardPanelHeader({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E8E8EC] px-5 py-5 dark:border-white/10">
      <div>
        <h3 className="genesis-heading flex items-center gap-2 text-base font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">
          {Icon && <Icon className="h-4 w-4 text-[#6B6B6B] dark:text-[#A7A7AE]" aria-hidden="true" />}
          {title}
        </h3>
        {description && <p className="mt-1 text-xs text-[#9C9C9C]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function DashboardEmpty({ icon: Icon, title, description, className }: { icon: LucideIcon; title: string; description?: string; className?: string }) {
  return (
    <div className={cn("flex min-h-40 flex-col items-center justify-center px-5 py-10 text-center", className)}>
      <Icon className="mb-3 h-6 w-6 text-[#9C9C9C]" aria-hidden="true" />
      <p className="text-sm font-medium text-[#6B6B6B] dark:text-[#A7A7AE]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-[#9C9C9C]">{description}</p>}
    </div>
  );
}

export const dashboardLinkClass = "text-xs font-semibold text-brand-text transition-colors hover:text-brand-text focus-visible:rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15";
