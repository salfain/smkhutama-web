import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://smkhutama.web.id"),
  title: {
    default: "CBT SMK HUTAMA – Sistem Ujian Online & Informasi Sekolah",
    template: "%s | SMK Hutama",
  },
  description:
    "SMK Hutama Pondok Gede — sekolah menengah kejuruan unggulan. Informasi PPDB, program keahlian, berita, serta sistem ujian online (CBT) modern, aman, dan efisien.",
  keywords: ["SMK Hutama", "PPDB SMK Hutama", "CBT", "ujian online", "SMK Pondok Gede", "sekolah kejuruan Bekasi"],
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
    title: "CBT SMK HUTAMA – Sistem Ujian Online & Informasi Sekolah",
    description:
      "Sekolah menengah kejuruan unggulan. Informasi PPDB, program keahlian, berita, dan sistem ujian online (CBT).",
    images: [{ url: "/api/school/logo", width: 512, height: 512, alt: "Logo SMK Hutama" }],
  },
  twitter: {
    card: "summary",
    title: "CBT SMK HUTAMA",
    description: "Sistem ujian online & informasi SMK Hutama Pondok Gede.",
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
