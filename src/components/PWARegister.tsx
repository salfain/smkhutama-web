"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isInPwaScope } from "@/lib/pwa-scope";

export function PWARegister() {
  const pathname = usePathname();
  const inScope = isInPwaScope(pathname);

  useEffect(() => {
    if (inScope && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [inScope]);

  return null;
}
