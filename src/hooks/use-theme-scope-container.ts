"use client";

import { useEffect, useRef, useState } from "react";

const SCOPE_SELECTOR = ".genesis-app, .landing-app";

/**
 * Elemen portal Radix (Dialog, Sheet, dst.) dipindah ke akhir <body> saat
 * dirender, keluar dari div `.genesis-app`/`.landing-app` tempat token warna
 * merek (`--brand`, dst.) di-scope — jadi kelas seperti `bg-brand` di dalamnya
 * jatuh ke nilai kosong (transparan), bukan warna merek area yang aktif.
 *
 * Hook ini menaruh elemen penanda tak terlihat di lokasi asal komponen
 * (sebelum ia dipindah portal), lalu mencari pembungkus bertema terdekat
 * dari situ. Provider global yang dipasang di root layout (mis. konfirmasi
 * dialog) tidak punya pembungkus sebagai leluhur sama sekali, jadi jatuh ke
 * satu-satunya `.genesis-app`/`.landing-app` yang sedang aktif di halaman.
 */
export function useThemeScopeContainer() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    const scoped = anchorRef.current?.closest<HTMLElement>(SCOPE_SELECTOR);
    setContainer(scoped ?? document.querySelector<HTMLElement>(SCOPE_SELECTOR) ?? undefined);
  }, []);

  return { anchorRef, container };
}
