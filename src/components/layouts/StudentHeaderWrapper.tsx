"use client";

import { usePathname } from "next/navigation";
import { StudentHeader } from "./StudentHeader";

type Props = { user: { name: string; nis: string | null; className: string | null } };

export function StudentHeaderWrapper({ user }: Props) {
  const pathname = usePathname();
  // Sembunyikan header saat halaman pengerjaan ujian (test) agar fullscreen
  const isTest = /\/student\/exams\/[^/]+\/test/.test(pathname);
  if (isTest) return null;
  return <StudentHeader user={user} />;
}
