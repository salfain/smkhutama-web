"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type MobileNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
};

type Props = {
  items: MobileNavItem[];
  /** Jumlah tombol yang tampil di pill sebelum tombol "Lainnya". */
  maxVisible?: number;
  moreLabel?: string;
  sheetTitle?: string;
  /** Konten tambahan di dalam sheet "Lainnya" (mis. kartu akun, tombol logout). */
  sheetExtra?: ReactNode;
  /** Kelas untuk menyembunyikan bar di layar besar. */
  hiddenAtClass?: string;
  /**
   * Sheet dirender lewat portal ke <body>, jadi ia keluar dari scope tema.
   * Isi prop ini dengan kelas pembawa token (mis. "landing-app") agar warna
   * merek di dalam sheet tetap ikut areanya.
   */
  sheetClassName?: string;
  printHidden?: boolean;
};

// Warna aksen diambil dari --bnav-* milik area terdekat (.genesis-app = indigo,
// .landing-app = emas), dengan indigo sebagai cadangan bila keduanya absen.
const itemBase =
  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-[background-color,color,box-shadow,transform] duration-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--bnav-from,#B45309)]/25";
const itemActive =
  "bg-[image:linear-gradient(to_bottom_right,var(--bnav-from,#B45309),var(--bnav-to,#92400E))] text-[var(--bnav-on,#FFFFFF)] shadow-md";
const itemIdle =
  "text-[#6B6B6B] hover:text-[var(--bnav-to,#92400E)] dark:text-[#A7A7AE] dark:hover:text-[var(--bnav-from,#FCD34D)]";

export function MobileBottomNav({
  items,
  maxVisible = 3,
  moreLabel = "Lainnya",
  sheetTitle = "Menu lainnya",
  sheetExtra,
  hiddenAtClass = "lg:hidden",
  sheetClassName = "",
  printHidden,
}: Props) {
  const pathname = usePathname();
  const isActive = (item: MobileNavItem) => {
    if (item.external) return false;
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const hasOverflow = items.length > maxVisible + 1 || Boolean(sheetExtra);
  const visible = hasOverflow ? items.slice(0, maxVisible) : items.slice(0, maxVisible + 1);
  const overflow = hasOverflow ? items.slice(maxVisible) : [];
  const moreActive = overflow.some(isActive);

  const renderPillItem = (item: MobileNavItem) => {
    const active = isActive(item);
    const className = `${itemBase} ${active ? itemActive : itemIdle}`;
    const content = (
      <>
        <item.icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} aria-hidden="true" />
        <span className="w-full truncate px-1 text-center">{item.label}</span>
      </>
    );

    return item.external ? (
      <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    ) : (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={className}>
        {content}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 ${hiddenAtClass} ${printHidden ? "print:hidden" : ""}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-auto mx-auto mb-3 flex h-16 max-w-[380px] items-center justify-around gap-1 rounded-full border border-black/[0.06] bg-white/85 px-2 shadow-[0_8px_32px_rgba(16,18,40,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[#1C1C1F]/85 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {visible.map(renderPillItem)}

        {hasOverflow && (
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={`Buka ${moreLabel.toLowerCase()}`}
                className={`${itemBase} ${moreActive ? itemActive : itemIdle}`}
              >
                <MoreHorizontal
                  className={`h-5 w-5 transition-transform ${moreActive ? "scale-110" : ""}`}
                  aria-hidden="true"
                />
                <span className="w-full truncate px-1 text-center">{moreLabel}</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className={`max-h-[80dvh] overflow-y-auto rounded-t-3xl border-[#E8E8EC] bg-[#FFFFFF] p-0 dark:border-white/10 dark:bg-[#161618] ${sheetClassName}`}
            >
              <div className="genesis-dashboard mx-auto w-full max-w-md px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
                <SheetTitle className="genesis-heading mb-4 text-lg font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">
                  {sheetTitle}
                </SheetTitle>

                {overflow.length > 0 && (
                  <div className="mb-4 flex flex-col gap-1">
                    {overflow.map((item) => {
                      const active = isActive(item);
                      const className = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-[var(--bnav-from,#B45309)] text-[var(--bnav-on,#FFFFFF)]"
                          : "text-[#6B6B6B] hover:bg-[#F5F5F7] hover:text-[#0A0A0A] dark:text-[#A7A7AE] dark:hover:bg-white/5 dark:hover:text-[#F5F5F7]"
                      }`;
                      const content = (
                        <>
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${active ? "" : "text-[#9C9C9C]"}`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      );

                      return item.external ? (
                        <a
                          key={item.href}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                        >
                          {content}
                        </a>
                      ) : (
                        <SheetClose asChild key={item.href}>
                          <Link href={item.href} className={className}>
                            {content}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>
                )}

                {sheetExtra}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
