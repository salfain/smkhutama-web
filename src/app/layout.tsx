import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://43.133.134.10"),
  title: {
    default: "CBT SMK HUTAMA – Sistem Ujian Online & Informasi Sekolah",
    template: "%s | SMK Hutama",
  },
  description:
    "SMK Hutama Pondok Gede — sekolah menengah kejuruan unggulan. Informasi PPDB, program keahlian, berita, serta sistem ujian online (CBT) modern, aman, dan efisien.",
  keywords: ["SMK Hutama", "PPDB SMK Hutama", "CBT", "ujian online", "SMK Pondok Gede", "sekolah kejuruan Bekasi"],
  icons: {
    icon: "/api/school/logo",
    shortcut: "/api/school/logo",
    apple: "/api/school/logo",
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
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}
      >
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
