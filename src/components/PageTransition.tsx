"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Menggunakan key pathname agar Framer Motion tahu kapan harus re-trigger
// animasi masuk (fade-in + slide-up) saat berpindah halaman.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="w-full flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
