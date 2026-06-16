"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, CalendarDays, CheckCircle2 } from "lucide-react";
import {
  createAcademicYear, updateAcademicYear, deleteAcademicYear, setActiveAcademicYear,
} from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

type AcademicYear = {
  id: string;
  year: string;
  semester: "GANJIL" | "GENAP";
  isActive: boolean;
  _count: { exams: number };
};

export function AcademicYearTable({ years }: { years: AcademicYear[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [error, setError] = useState("");
  const [semester, setSemester] = useState<"GANJIL" | "GENAP">("GANJIL");
  const [isActive, setIsActive] = useState(false);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function openCreate() {
    setEditing(null);
    setSemester("GANJIL");
    setIsActive(false);
    setError("");
    setOpen(true);
  }

  function openEdit(y: AcademicYear) {
    setEditing(y);
    setSemester(y.semester);
    setIsActive(y.isActive);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("semester", semester);
    if (isActive) formData.set("isActive", "on");
    else formData.delete("isActive");

    startTransition(async () => {
      const result = editing
        ? await updateAcademicYear(editing.id, formData)
        : await createAcademicYear(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  async function handleDelete(y: AcademicYear) {
    if (!(await confirm(`Hapus tahun ajaran "${y.year} ${y.semester}"?`))) return;
    startTransition(async () => {
      const result = await deleteAcademicYear(y.id);
      if (result.error) alert(result.error);
    });
  }

  function handleActivate(y: AcademicYear) {
    startTransition(async () => {
      const result = await setActiveAcademicYear(y.id);
      if (result.error) alert(result.error);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Tahun Ajaran
        </Button>
      </div>

      {years.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <CalendarDays className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada tahun ajaran terdaftar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map((y) => (
            <div key={y.id} className={`rounded-xl border p-4 shadow-sm transition-colors ${y.isActive ? "border-green-300 bg-green-50/50" : "bg-white hover:border-blue-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${y.isActive ? "bg-green-100" : "bg-blue-50"}`}>
                    <CalendarDays className={`h-5 w-5 ${y.isActive ? "text-green-600" : "text-blue-600"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">Tahun Ajaran {y.year}</p>
                      {y.isActive && (
                        <Badge className="gap-1 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3" />Aktif
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Semester {y.semester === "GANJIL" ? "Ganjil" : "Genap"} · {y._count.exams} ujian
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!y.isActive && (
                    <Button variant="outline" size="sm" className="gap-1 text-green-600 border-green-200 hover:bg-green-50 text-xs" onClick={() => handleActivate(y)}>
                      <CheckCircle2 className="h-3 w-3" />Aktifkan
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openEdit(y)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(y)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="year">Tahun Ajaran</Label>
              <Input id="year" name="year" defaultValue={editing?.year ?? ""} placeholder="cth: 2025/2026" required />
              <p className="text-xs text-gray-400">Format: YYYY/YYYY</p>
            </div>
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => setSemester(v as "GANJIL" | "GENAP")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GANJIL">Ganjil</SelectItem>
                  <SelectItem value="GENAP">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border bg-gray-50 p-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Set sebagai tahun ajaran aktif</p>
                <p className="text-xs text-gray-500">Hanya 1 tahun ajaran yang bisa aktif. Yang lain otomatis nonaktif.</p>
              </div>
            </label>
            {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
