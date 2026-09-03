"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, KeyRound } from "lucide-react";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SheetClose } from "@/components/ui/sheet";

export type GenesisNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
};

type Props = {
  brandAbbr: string;
  brandTitle: string;
  brandSubtitle: string;
  navItems: GenesisNavItem[];
  userName: string;
  userDetail: string;
  changePasswordHref?: string;
  logoutControl?: ReactNode;
  printHidden?: boolean;
};

function initialsFor(name: string, fallback: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || fallback;
}

function AccountControls({
  brandAbbr,
  userName,
  userDetail,
  changePasswordHref,
  logoutControl,
  closeOnNavigate = false,
  showThemeToggle = false,
}: Pick<Props, "brandAbbr" | "userName" | "userDetail" | "changePasswordHref" | "logoutControl"> & {
  closeOnNavigate?: boolean;
  /** Hanya untuk sheet mobile - di desktop tombol tema tinggal di header. */
  showThemeToggle?: boolean;
}) {
  const passwordLink = changePasswordHref ? (
    <Link href={changePasswordHref} className="mb-1 flex h-9 items-center gap-2.5 rounded-md border border-[#E8E8EC] px-3 text-xs font-medium text-[#6B6B6B] transition-all hover:-translate-y-px hover:border-[#D8D8DE] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15 dark:border-white/10 dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]">
      <KeyRound className="h-3.5 w-3.5 text-[#9C9C9C]" aria-hidden="true" />
      Ganti Password
    </Link>
  ) : null;

  return (
    <>
      <div className="mb-2 flex items-center gap-3 rounded-lg border border-[#E8E8EC] bg-[#FAFAFA] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text dark:bg-brand/10 dark:text-brand-text">
          {initialsFor(userName, brandAbbr)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{userName}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#9C9C9C]" title={userDetail}>{userDetail}</p>
        </div>
      </div>

      <NotificationCenter />
      {passwordLink && (closeOnNavigate ? <SheetClose asChild>{passwordLink}</SheetClose> : passwordLink)}

      {showThemeToggle && (
        <ThemeToggle
          showLabel
          className="mb-1 h-9 w-full justify-start gap-2.5 rounded-md border border-[#E8E8EC] px-3 text-xs font-medium text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] dark:border-white/10 dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]"
        />
      )}

      <div className="[&_button]:h-9 [&_button]:rounded-md [&_button]:text-xs [&_button]:font-medium">
        {logoutControl ?? <LogoutButton className="dark:hover:bg-red-500/10" />}
      </div>
    </>
  );
}

function SidebarContent({
  brandAbbr,
  brandTitle,
  brandSubtitle,
  navItems,
  userName,
  userDetail,
  changePasswordHref,
  logoutControl,
}: Props) {
  const pathname = usePathname();
  return (
    <div className="genesis-dashboard flex h-full flex-col bg-[#FFFFFF] dark:bg-[#161618]">
      <div className="border-b border-[#E8E8EC] px-5 py-5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="genesis-heading flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
            {brandAbbr}
          </div>
          <div className="min-w-0 flex-1">
            <p className="genesis-heading truncate text-[13px] font-semibold leading-tight text-[#0A0A0A] dark:text-[#F5F5F7]" title={brandTitle}>
              {brandTitle}
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-[#6B6B6B] dark:text-[#A7A7AE]">{brandSubtitle}</p>
          </div>
          {/* Preferensi tampilan, bukan urusan akun - tempatnya di header
              bersama identitas, agar footer tersisa untuk aksi akun saja. */}
          <ThemeToggle className="shrink-0 rounded-md text-[#6B6B6B] hover:bg-[#F5F5F7] dark:text-[#A7A7AE] dark:hover:bg-white/5" />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9C9C9C]">Navigasi</p>
        {navItems.map((item) => {
          const active = !item.external && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const className = `group flex min-h-10 items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15 ${
            active
              ? "bg-brand text-white"
              : "text-[#6B6B6B] hover:bg-[#F5F5F7] hover:text-[#0A0A0A] dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]"
          }`;
          const content = (
            <>
              <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#9C9C9C] group-hover:text-brand-text"}`} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" aria-hidden="true" />}
            </>
          );

          return item.external ? (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
          ) : (
            <Link key={item.href} href={item.href} className={className}>{content}</Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E8E8EC] p-3 dark:border-white/10">
        <AccountControls
          brandAbbr={brandAbbr}
          userName={userName}
          userDetail={userDetail}
          changePasswordHref={changePasswordHref}
          logoutControl={logoutControl}
        />
      </div>
    </div>
  );
}

export function GenesisSidebar(props: Props) {
  const printClass = props.printHidden ? "print:hidden" : "";

  return (
    <>
      <aside className={`hidden w-64 shrink-0 border-r border-[#E8E8EC] bg-[#FFFFFF] lg:flex lg:flex-col dark:border-white/10 dark:bg-[#161618] ${printClass}`}>
        <SidebarContent {...props} />
      </aside>
      <MobileBottomNav
        items={props.navItems}
        sheetTitle="Menu & akun"
        printHidden={props.printHidden}
        sheetExtra={
          <div className="border-t border-[#E8E8EC] pt-4 dark:border-white/10">
            <AccountControls
              brandAbbr={props.brandAbbr}
              userName={props.userName}
              userDetail={props.userDetail}
              changePasswordHref={props.changePasswordHref}
              logoutControl={props.logoutControl}
              closeOnNavigate
              showThemeToggle
            />
          </div>
        }
      />
    </>
  );
}
