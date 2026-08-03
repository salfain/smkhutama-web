"use client";

import { useState } from "react";
import { BarChart3, ExternalLink, GraduationCap, HelpCircle, Image, Images, LayoutDashboard, LogOut, Newspaper, Settings, Sparkles, UserCog, Users } from "lucide-react";
import { cmsLogout } from "@/app/cms/actions";
import { useConfirm } from "@/components/ConfirmDialog";
import { GenesisSidebar } from "@/components/layouts/GenesisSidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/cms/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cms/profile", icon: Settings, label: "Profil & Hero" },
  { href: "/cms/hero-images", icon: Image, label: "Gambar Hero" },
  { href: "/cms/stats", icon: BarChart3, label: "Statistik" },
  { href: "/cms/majors", icon: GraduationCap, label: "Jurusan" },
  { href: "/cms/teachers", icon: UserCog, label: "Data Guru" },
  { href: "/cms/extracurriculars", icon: Sparkles, label: "Ekstrakurikuler" },
  { href: "/cms/gallery", icon: Images, label: "Galeri" },
  { href: "/cms/news", icon: Newspaper, label: "Berita" },
  { href: "/cms/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/cms/registrations", icon: Users, label: "Pendaftar PPDB" },
  { href: "/", icon: ExternalLink, label: "Lihat Beranda", external: true },
];

export function CmsSidebar({ name }: { name: string }) {
  const [pending, setPending] = useState(false);
  const confirm = useConfirm();

  async function handleLogout() {
    if (pending) return;
    const ok = await confirm({
      title: "Keluar dari akun?",
      description: "Anda akan keluar dari sesi CMS dan kembali ke halaman login.",
      confirmText: "Ya, Keluar",
      cancelText: "Batal",
      variant: "danger",
      icon: "logout",
    });
    if (!ok) return;
    setPending(true);
    try {
      await cmsLogout();
    } catch {
      setPending(false);
    }
  }

  const logoutControl = (
    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" onClick={handleLogout} disabled={pending}>
      <LogOut className="h-4 w-4" />{pending ? "Keluar..." : "Keluar"}
    </Button>
  );

  return (
    <GenesisSidebar
      brandAbbr="CM"
      brandTitle="CMS SMK HUTAMA"
      brandSubtitle="Konten & PPDB"
      navItems={navItems}
      userName={name}
      userDetail="Admin Landing"
      logoutControl={logoutControl}
    />
  );
}
