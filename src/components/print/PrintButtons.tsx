"use client";

export function PrintButtons() {
  return (
    <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => window.history.back()}
        className="rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow hover:bg-gray-50"
      >
        ← Kembali
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
      >
        🖨️ Cetak / PDF
      </button>
    </div>
  );
}

export function PrintButtonsRed() {
  return (
    <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => window.history.back()}
        className="rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow hover:bg-gray-50"
      >
        ← Kembali
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
      >
        🖨️ Cetak / PDF
      </button>
    </div>
  );
}

export function PrintButtonsPurple() {
  return (
    <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => window.history.back()}
        className="rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow hover:bg-gray-50"
      >
        ← Kembali
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700"
      >
        🖨️ Cetak / PDF
      </button>
    </div>
  );
}

export function SchoolLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/api/school/logo"
      alt="Logo"
      className="h-16 w-16 object-contain shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}
