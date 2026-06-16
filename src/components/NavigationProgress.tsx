"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevUrl = useRef("");

  const start = useCallback(() => {
    setVisible(true);
    setProgress(20);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + Math.random() * 10;
      });
    }, 200);
  }, []);

  const complete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    const url = pathname + searchParams.toString();
    if (prevUrl.current && prevUrl.current !== url) {
      complete();
    }
    prevUrl.current = url;
  }, [pathname, searchParams, complete]);

  // Intercept link clicks to trigger start
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      if (href === pathname) return;
      start();
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, start]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 transition-all duration-200 ease-out shadow-sm shadow-blue-500/30"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
