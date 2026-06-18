import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Newspaper, Users, BarChart3, Image as ImageIcon, ArrowRight } from "lucide-react";

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
    { label: "Jurusan", value: majors, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50", href: "/cms/majors" },
    { label: "Berita", value: news, icon: Newspaper, color: "text-indigo-600", bg: "bg-indigo-50", href: "/cms/news" },
    { label: "Pendaftar PPDB", value: registrations, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", href: "/cms/registrations" },
    { label: "Statistik", value: stats, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50", href: "/cms/stats" },
    { label: "Gambar Hero", value: heroImages, icon: ImageIcon, color: "text-cyan-600", bg: "bg-cyan-50", href: "/cms/hero-images" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard CMS</h1>
        <p className="text-sm text-gray-500">Kelola konten halaman beranda & pendaftaran online</p>
      </div>

      {pendingReg > 0 && (
        <Link href="/cms/registrations">
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-800"><strong>{pendingReg} pendaftar baru</strong> menunggu verifikasi</p>
            <ArrowRight className="h-4 w-4 text-emerald-600" />
          </div>
        </Link>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-4">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <p className="font-heading text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
        <p className="font-semibold text-gray-700 mb-2">Mulai dari sini</p>
        <ul className="space-y-1.5 text-sm text-gray-600">
          <li>• <Link href="/cms/profile" className="text-blue-600 hover:underline">Profil & Hero</Link> — atur judul, logo, kontak, status PPDB</li>
          <li>• <Link href="/cms/majors" className="text-blue-600 hover:underline">Jurusan</Link> — kelola program keahlian</li>
          <li>• <Link href="/cms/news" className="text-blue-600 hover:underline">Berita</Link> — publikasikan kegiatan terbaru</li>
          <li>• <Link href="/cms/registrations" className="text-blue-600 hover:underline">Pendaftar PPDB</Link> — verifikasi calon siswa</li>
        </ul>
      </div>
    </div>
  );
}
