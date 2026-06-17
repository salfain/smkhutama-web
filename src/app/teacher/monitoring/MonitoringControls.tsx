"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Unlock, Send } from "lucide-react";
import { unlockAttemptByTeacher, forceSubmitAttemptByTeacher } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

export function MonitoringControls({ attemptId, name, isLocked }: { attemptId: string; name: string; isLocked: boolean }) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  if (!isLocked) return null;

  function unlock() {
    startTransition(async () => {
      if (!(await confirm({
        title: "Buka kunci ujian?",
        description: `Siswa "${name}" akan dapat melanjutkan ujian. Counter pelanggaran direset.`,
        confirmText: "Ya, Buka Kunci", variant: "info", icon: "info",
      }))) return;
      const r = await unlockAttemptByTeacher(attemptId);
      if (r.error) alert(r.error);
    });
  }

  function forceSubmit() {
    startTransition(async () => {
      if (!(await confirm({
        title: "Submit paksa?",
        description: `Ujian "${name}" akan dikumpulkan dengan jawaban yang sudah ada. Tindakan ini tidak bisa dibatalkan.`,
        confirmText: "Submit Paksa", variant: "danger", icon: "warning",
      }))) return;
      const r = await forceSubmitAttemptByTeacher(attemptId);
      if (r.error) alert(r.error);
    });
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      <Button size="sm" variant="outline" className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50 text-xs" onClick={unlock} disabled={pending}>
        <Unlock className="h-3 w-3" />Buka Kunci
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5 text-red-700 border-red-300 hover:bg-red-50 text-xs" onClick={forceSubmit} disabled={pending}>
        <Send className="h-3 w-3" />Submit Paksa
      </Button>
    </div>
  );
}
