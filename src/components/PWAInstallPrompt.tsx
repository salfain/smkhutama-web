"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isInPwaScope } from "@/lib/pwa-scope";

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function wasRecentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const elapsedMs = Date.now() - Number(raw);
  return elapsedMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function PWAInstallPrompt() {
  const pathname = usePathname();
  const inScope = isInPwaScope(pathname);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);

  // Browser hanya mengirim `beforeinstallprompt` sekali per muat halaman, jadi
  // event ini ditangkap segera terlepas dari rute saat ini agar tidak hilang
  // sebelum pengguna berpindah ke rute yang termasuk cakupan PWA.
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!inScope || wasRecentlyDismissed()) {
      setVisible(false);
      return;
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setVisible(false);
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    if (isIOS) {
      setShowIOSHint(true);
      setVisible(true);
      return;
    }

    setShowIOSHint(false);
    setVisible(Boolean(deferredPrompt));
  }, [inScope, deferredPrompt]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-border bg-background p-3 shadow-lg sm:right-4 sm:left-auto">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Download className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Instal Portal SMK Hutama</p>
        {showIOSHint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ketuk tombol Bagikan <Share className="inline size-3" /> lalu pilih &quot;Tambah ke Layar
            Utama&quot;.
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Akses lebih cepat langsung dari layar utama perangkat Anda.
          </p>
        )}
        {!showIOSHint && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={install}>
              Instal
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Nanti saja
            </Button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
