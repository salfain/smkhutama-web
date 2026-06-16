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
  title: "CBT SMK HUTAMA – Sistem Ujian Online",
  description:
    "Sistem Computer Based Test (CBT) SMK HUTAMA. Platform ujian digital modern, aman, dan efisien.",
  keywords: ["CBT", "ujian online", "SMK HUTAMA", "TKA"],
  icons: {
    icon: "/api/school/logo",
    shortcut: "/api/school/logo",
    apple: "/api/school/logo",
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
