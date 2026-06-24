"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function QuestionSetPrintActions() {
  return (
    <Button
      type="button"
      className="gap-2 bg-blue-600 shadow-sm hover:bg-blue-700"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      Export PDF
    </Button>
  );
}
