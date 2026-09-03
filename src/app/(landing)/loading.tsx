export default function LandingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-alt">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-hairline" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-transparent border-t-brand animate-spin" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Memuat...</p>
      </div>
    </div>
  );
}
