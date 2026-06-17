"use client";

import Link from "next/link";
import { ArrowUpRight, Newspaper } from "lucide-react";
import { RevealContainer, RevealCard } from "./Reveal";

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | string;
  imageUrl?: string | null;
};

export function NewsGrid({ news }: { news: NewsItem[] }) {
  return (
    <RevealContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {news.map((item) => (
        <RevealCard key={item.id}>
          <Link
            href={`/berita/${item.slug}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl h-full"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                <Newspaper className="h-12 w-12 text-white/40" />
              </div>
            )}
            <div className="flex flex-col flex-1 p-5">
              <time className="text-[11px] font-medium text-slate-400">
                {new Date(item.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <h3 className="mt-1.5 line-clamp-2 font-bold text-slate-900 dark:text-white transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">
                {item.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                Selengkapnya <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </Link>
        </RevealCard>
      ))}
    </RevealContainer>
  );
}
