export default function CounselorLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Memuat...</p>
      </div>
    </div>
  );
}
