import Link from "next/link";
import { ArrowRight, BarChart3, GraduationCap, Image as ImageIcon, Newspaper, Settings, Users } from "lucide-react";
import {
  DashboardHeader,
  DashboardMetric,
  DashboardPanel,
  DashboardPanelHeader,
  DashboardPill,
  DashboardSectionHeading,
  GenesisDashboard,
} from "@/components/dashboard/GenesisDashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard CMS" };

export default async function CmsDashboard() {
  const [majors, news, registrations, pendingReg, stats, heroImages] = await Promise.all([
    prisma.landingMajor.count(),
    prisma.landingNews.count(),
    prisma.registration.count(),
    prisma.registration.count({ where: { status: "PENDING" } }),
    prisma.landingStat.count(),
    prisma.landingHeroImage.count(),
  ]);

  const cards = [
    { label: "Jurusan", value: majors, icon: GraduationCap, detail: "Program keahlian", href: "/cms/majors" },
    { label: "Berita", value: news, icon: Newspaper, detail: "Konten publikasi", href: "/cms/news" },
    { label: "Pendaftar PPDB", value: registrations, icon: Users, detail: `${pendingReg} menunggu`, href: "/cms/registrations" },
    { label: "Statistik", value: stats, icon: BarChart3, detail: "Data beranda", href: "/cms/stats" },
    { label: "Gambar Hero", value: heroImages, icon: ImageIcon, detail: "Media aktif", href: "/cms/hero-images" },
  ];

  const guides = [
    { href: "/cms/profile", label: "Profil & Hero", description: "Atur judul, logo, kontak, dan status PPDB." },
    { href: "/cms/majors", label: "Jurusan", description: "Kelola program keahlian yang tampil di beranda." },
    { href: "/cms/news", label: "Berita", description: "Publikasikan kegiatan dan informasi terbaru." },
    { href: "/cms/registrations", label: "Pendaftar PPDB", description: "Tinjau dan verifikasi calon siswa." },
  ];

  return (
    <GenesisDashboard>
      <DashboardHeader
        eyebrow="Content management system"
        title="Dashboard CMS"
        description="Kelola konten halaman beranda dan pendaftaran online SMK Hutama."
        status={pendingReg > 0 ? <DashboardPill tone="warning">{pendingReg} pendaftar menunggu</DashboardPill> : <DashboardPill tone="success">Semua tertangani</DashboardPill>}
      />

      {pendingReg > 0 && (
        <Link
          href="/cms/registrations"
          className="mb-8 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(245,158,11,0.18)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-500/15 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <span><strong>{pendingReg} pendaftar baru</strong> menunggu verifikasi.</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      <section className="mb-10" aria-labelledby="cms-summary">
        <DashboardSectionHeading title="Ringkasan konten" description="Jumlah data yang saat ini tampil dan dikelola." />
        <div id="cms-summary" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {cards.map((card) => <DashboardMetric key={card.label} {...card} />)}
        </div>
      </section>

      <section aria-labelledby="cms-guide">
        <DashboardSectionHeading title="Mulai dari sini" description="Akses cepat untuk pekerjaan pengelolaan konten." />
        <DashboardPanel>
          <DashboardPanelHeader icon={Settings} title="Panduan pengelolaan" description="Pilih area yang ingin diperbarui" />
          <div id="cms-guide" className="divide-y divide-[#E8E8EC] dark:divide-white/10">
            {guides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-brand/15 dark:hover:bg-white/[0.03]">
                <div>
                  <p className="text-sm font-medium text-[#0A0A0A] group-hover:text-brand-text dark:text-[#F5F5F7] dark:group-hover:text-brand-text">{guide.label}</p>
                  <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A7A7AE]">{guide.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#9C9C9C] transition-transform group-hover:translate-x-1 group-hover:text-brand-text" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </DashboardPanel>
      </section>
    </GenesisDashboard>
  );
}
