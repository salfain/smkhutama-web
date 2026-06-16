"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  KeyRound, RefreshCw, Copy, Check, Eye, EyeOff, Zap,
  Trash2, Power, PowerOff, AlertCircle,
} from "lucide-react";
import { createToken, regenerateToken, toggleTokenStatus, deleteToken } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Token = {
  id: string;
  token: string;
  expiredAt: Date;
  isActive: boolean;
  createdAt: Date;
  exam: {
    id: string;
    title: string;
    status: string;
    subject: { code: string };
    _count: { attempts: number };
  };
};

type Exam = { id: string; title: string; status: string; subject: { code: string } };

export function TokenManager({ tokens, exams }: { tokens: Token[]; exams: Exam[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [examId, setExamId] = useState("");
  const [duration, setDuration] = useState("60");
  const [latestToken, setLatestToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function copy(id: string, val: string) {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleVisibility(id: string) {
    setShowTokens((p) => ({ ...p, [id]: !p[id] }));
  }

  function handleGenerate() {
    setError(""); setLatestToken(null);
    if (!examId) { setError("Pilih ujian dulu"); return; }
    const fd = new FormData();
    fd.set("examId", examId); fd.set("durationMinutes", duration);
    startTransition(async () => {
      const r = await createToken(fd);
      if (r.error) setError(r.error);
      else if (r.token) setLatestToken(r.token);
    });
  }

  async function handleRegen(id: string) {
    if (!(await confirm("Regenerate token? Token lama akan diganti."))) return;
    startTransition(async () => {
      const r = await regenerateToken(id);
      if (r.error) alert(r.error);
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const r = await toggleTokenStatus(id);
      if (r.error) alert(r.error);
    });
  }

  async function handleDelete(id: string) {
    if (!(await confirm("Hapus token ini?"))) return;
    startTransition(async () => {
      const r = await deleteToken(id);
      if (r.error) alert(r.error);
    });
  }

  function formatExp(d: Date): string {
    const exp = new Date(d).getTime();
    const now = Date.now();
    if (exp < now) return "Kadaluarsa";
    const diffMin = Math.floor((exp - now) / 60000);
    if (diffMin < 60) return `${diffMin} mnt lagi`;
    return `${Math.floor(diffMin / 60)}j ${diffMin % 60}m lagi`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Generator */}
      <div className="lg:col-span-1">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-yellow-500" />Generate Token Baru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Pilih Ujian</Label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger><SelectValue placeholder="Pilih ujian..." /></SelectTrigger>
                <SelectContent>
                  {exams.length === 0 ? (
                    <div className="p-3 text-xs text-gray-400">Belum ada ujian. Buat di /admin/exams</div>
                  ) : exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.subject.code} – {e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durasi Token</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 menit</SelectItem>
                  <SelectItem value="60">1 jam</SelectItem>
                  <SelectItem value="120">2 jam</SelectItem>
                  <SelectItem value="240">4 jam</SelectItem>
                  <SelectItem value="480">8 jam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700" disabled={pending} onClick={handleGenerate}>
              <KeyRound className="h-4 w-4" />Generate Token
            </Button>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}

            <div className={`rounded-lg border-2 ${latestToken ? "border-green-300 bg-green-50" : "border-dashed border-gray-200 bg-gray-50"} p-4 text-center`}>
              {latestToken ? (
                <>
                  <p className="text-xs text-green-700 mb-2 font-semibold">✓ Token berhasil dibuat</p>
                  <div className="font-mono text-2xl font-bold text-green-700 tracking-widest">{latestToken}</div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-2">Token akan muncul di sini</p>
                  <div className="font-mono text-2xl font-bold text-gray-300 tracking-widest">••••-••••</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Token ({tokens.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                <KeyRound className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">Belum ada token. Generate token baru di sebelah kiri.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {tokens.map((t) => {
                  const expired = new Date(t.expiredAt).getTime() < Date.now();
                  const reallyActive = t.isActive && !expired;
                  return (
                    <div key={t.id} className={`rounded-xl border p-4 ${reallyActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-70"}`}>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="font-mono text-xs">{t.exam.subject.code}</Badge>
                            <p className="font-medium text-gray-900 text-sm truncate">{t.exam.title}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Berakhir: {formatExp(t.expiredAt)} · {t.exam._count.attempts} percobaan ujian
                          </p>
                        </div>
                        <Badge className={reallyActive
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100 shrink-0"
                          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 shrink-0"}>
                          {expired ? "Kadaluarsa" : t.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg border bg-gray-50 px-4 py-2.5 font-mono text-xl font-bold tracking-[0.3em] text-center text-gray-800">
                          {showTokens[t.id] ? t.token : t.token.replace(/[A-Z0-9]/g, "•")}
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => toggleVisibility(t.id)} title="Tampilkan/Sembunyikan">
                          {showTokens[t.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => copy(t.id, t.token)} title="Salin">
                          {copiedId === t.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleRegen(t.id)} title="Regenerate">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className={`h-10 w-10 shrink-0 ${t.isActive ? "text-yellow-600 border-yellow-200 hover:bg-yellow-50" : "text-green-600 border-green-200 hover:bg-green-50"}`} onClick={() => handleToggle(t.id)} title={t.isActive ? "Nonaktifkan" : "Aktifkan"}>
                          {t.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(t.id)} title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
