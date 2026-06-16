"use client";

import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PrintButton() {
  return (
    <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
      <Link href="/counselor/cases">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />Kembali
        </Button>
      </Link>
      <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />Cetak / Simpan PDF
      </Button>
    </div>
  );
}
