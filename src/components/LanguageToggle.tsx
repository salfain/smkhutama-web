"use client";

import { useLanguage } from "./LanguageProvider";
import { Button } from "./ui/button";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 rounded-full p-0 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
      onClick={() => setLanguage(language === "ID" ? "EN" : "ID")}
      title={language === "ID" ? "Switch to English" : "Ubah ke Bahasa Indonesia"}
    >
      {language === "ID" ? "ID" : "EN"}
    </Button>
  );
}
