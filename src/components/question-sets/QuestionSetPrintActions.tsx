"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function QuestionSetPrintActions() {
  return (
    <Button
      type="button"
      className="gap-2 bg-brand shadow-sm hover:bg-brand-strong"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      Export PDF
    </Button>
  );
}
