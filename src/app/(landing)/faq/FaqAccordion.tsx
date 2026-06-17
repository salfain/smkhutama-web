"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Faq = { id: string; question: string; answer: string };

export function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <button
              onClick={() => setOpen(isOpen ? null : f.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-slate-900 dark:text-white">{f.question}</span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-amber-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
