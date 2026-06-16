export function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Top bar shimmer */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-gray-100 animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-gray-200 animate-pulse" />
      </div>

      {/* Cards row */}
      <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-7 w-14 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
              <div className="h-9 w-9 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-8 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 flex-1 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Memuat...</p>
      </div>
    </div>
  );
}

export function LoadingCards() {
  return (
    <div className="p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-4 w-32 rounded-md bg-gray-100 animate-pulse" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-gray-100 animate-pulse" />
            </div>
            <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
