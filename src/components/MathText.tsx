"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Render teks yang boleh mengandung rumus LaTeX:
 * - Inline: $ ... $
 * - Block:  $$ ... $$
 * Bagian non-rumus tetap teks biasa (newline dipertahankan via whitespace-pre-wrap).
 */
export function MathText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;

  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let html = "";
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    // teks biasa sebelum rumus
    if (m.index > last) html += escapeHtml(text.slice(last, m.index));
    const token = m[0];
    const display = token.startsWith("$$");
    const expr = display ? token.slice(2, -2) : token.slice(1, -1);
    try {
      html += katex.renderToString(expr, { throwOnError: false, displayMode: display });
    } catch {
      html += escapeHtml(token);
    }
    last = m.index + token.length;
  }
  if (last < text.length) html += escapeHtml(text.slice(last));

  return <span className={`whitespace-pre-wrap ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
