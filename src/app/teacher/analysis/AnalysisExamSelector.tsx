"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ExamOption = { id: string; title: string; subjectCode: string; endAt: Date; attemptCount: number };

export function AnalysisExamSelector({
  exams,
  selectedId,
}: {
  exams: ExamOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(val: string) {
    router.push(`${pathname}?examId=${val}`);
  }

  return (
    <Select value={selectedId} onValueChange={handleChange}>
      <SelectTrigger className="w-full max-w-lg">
        <SelectValue placeholder="Pilih ujian untuk dianalisis" />
      </SelectTrigger>
      <SelectContent>
        {exams.map((e) => (
          <SelectItem key={e.id} value={e.id}>
            <span className="font-medium">{e.title}</span>
            <span className="ml-2 text-xs text-gray-400">
              [{e.subjectCode}] · {e.attemptCount} peserta · {new Date(e.endAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
