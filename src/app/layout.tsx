import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://smkhutama.web.id"),
  title: {
    default: "SMK HUTAMA — Portal Akademik, CBT & Konseling Sekolah",
    template: "%s | SMK Hutama",
  },
  description:
    "Portal resmi SMK Hutama Pondok Gede. Akses sistem ujian online (CBT), bimbingan konseling (SIBIKONS), informasi akademik, berita sekolah, dan pendaftaran siswa baru (PPDB) terpadu.",
  keywords: ["SMK Hutama", "PPDB SMK Hutama", "CBT SMK", "SIBIKONS", "Ujian Online SMK", "SMK Pondok Gede", "Sekolah Kejuruan Bekasi"],
  icons: {
    icon: [
      { url: "/uploads/school/logo.png", type: "image/png" }
    ],
    shortcut: "/uploads/school/logo.png",
    apple: "/uploads/school/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "SMK Hutama Pondok Gede",
    title: "SMK HUTAMA — Portal Akademik, CBT & Konseling Sekolah",
    description:
      "Portal resmi terpadu SMK Hutama Pondok Gede. Menyediakan website profil sekolah, sistem ujian online (CBT), dan bimbingan konseling (SIBIKONS) modern.",
    images: [{ url: "/api/school/logo", width: 512, height: 512, alt: "Logo SMK Hutama" }],
  },
  twitter: {
    card: "summary",
    title: "SMK HUTAMA",
    description: "Portal Akademik, CBT & Konseling SMK Hutama Pondok Gede.",
    images: ["/api/school/logo"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Hubungkan ke Bunny Fonts CDN */}
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=inter:400,500,600,700|plus-jakarta-sans:400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
