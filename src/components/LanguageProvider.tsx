"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { id, type LocaleType } from "@/locales/id";
import { en } from "@/locales/en";

type Language = "ID" | "EN";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof LocaleType, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const dictionaries: Record<Language, LocaleType> = {
  ID: id,
  EN: en,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ID");

  useEffect(() => {
    const saved = localStorage.getItem("cbt-lang") as Language | null;
    if (saved === "ID" || saved === "EN") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("cbt-lang", lang);
  };

  const t = (key: keyof LocaleType, fallback?: string): string => {
    const dict = dictionaries[language];
    return dict[key] || fallback || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
