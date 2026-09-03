"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

// Tema baru diketahui setelah hidrasi. useSyncExternalStore memberi false di
// server dan true di klien tanpa setState di dalam effect - pola lama
// (useState + useEffect) melanggar aturan react-hooks/set-state-in-effect.
const noopSubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({
  className = "",
  /** Tampilkan teks "Mode Terang/Gelap" - untuk baris menu, bukan tombol ikon. */
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);

  // Saat showLabel aktif, ukuran diserahkan ke className pemanggil supaya
  // `h-9 w-9` bawaan tombol ikon tidak beradu dengan lebar penuh.
  const sizeClass = showLabel ? "" : "h-9 w-9";
  const label = theme === "dark" ? "Mode Terang" : "Mode Gelap";

  if (!mounted) {
    return (
      <Button variant="ghost" size={showLabel ? "sm" : "icon"} className={`${sizeClass} ${className}`} disabled>
        <Sun className="h-4 w-4" />
        {showLabel && <span>Mode Terang</span>}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      className={`${sizeClass} ${className}`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={label}
      aria-label={label}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-yellow-400" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
