"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Trash2, Users } from "lucide-react";
import { updateRegistrationStatus, deleteRegistration } from "../content-actions";

type Reg = {
  id: string; registNumber: string; fullName: string; nisn: string | null;
  gender: string | null; phone: string | null; email: string | null;
  originSchool: string | null; selectedMajor: string | null;
  parentName: string | null; parentPhone: string | null; address: string | null;
  status: string; createdAt: string;
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  VERIFIED: "bg-blue-100 text-blue-700 border-blue-200",
  ACCEPTED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};
const statusLabel: Record<string, string> = {
  PENDING: "Menunggu", VERIFIED: "Terverifikasi", ACCEPTED: "Diterima", REJECTED: "Ditolak",
};

export function RegistrationsClient({ registrations }: { registrations: Reg[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Reg | null>(null);
  const [, startTransition] = useTransition();

  function setStatus(id: string, status: "PENDING" | "VERIFIED" | "ACCEPTED" | "REJECTED") {
    startTransition(async () => { await updateRegistrationStatus(id, status); });
  }
  function remove(id: string) {
    if (!confirm("Hapus data pendaftar ini?")) return;
    startTransition(async () => { await deleteRegistration(id); });
  }

  const filtered = registrations.filter((r) =>
    (r.fullName.toLowerCase().includes(search.toLowerCase()) || r.registNumber.toLowerCase().includes(search.toLowerCase())) &&
    (filter === "all" || r.status === filter)
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Cari nama atau no. pendaftaran..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Semua Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
            <SelectItem value="ACCEPTED">Diterima</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            {registrations.length === 0 ? "Belum ada pendaftar." : "Tidak ada hasil pencarian."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["No", "No. Pendaftaran", "Nama", "Jurusan", "HP", "Tgl Daftar", "Status", "Aksi"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{r.registNumber}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{r.fullName}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.selectedMajor ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{r.phone ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={`text-xs hover:opacity-100 ${statusStyle[r.status] ?? ""}`}>
                        {statusLabel[r.status] ?? r.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => setDetail(r)} title="Detail">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => remove(r.id)} title="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-3 py-2 text-xs text-gray-400">
            {filtered.length} dari {registrations.length} pendaftar
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => { if (!v) setDetail(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detail Pendaftar</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl bg-gray-50 border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">No. Pendaftaran</span><span className="font-mono font-semibold">{detail.registNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Nama</span><span className="font-semibold">{detail.fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">NISN</span><span>{detail.nisn ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Jenis Kelamin</span><span>{detail.gender === "MALE" ? "Laki-laki" : detail.gender === "FEMALE" ? "Perempuan" : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">No. HP</span><span>{detail.phone ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{detail.email ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Asal Sekolah</span><span>{detail.originSchool ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pilihan Jurusan</span><span className="font-semibold">{detail.selectedMajor ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Orang Tua</span><span>{detail.parentName ?? "—"} · {detail.parentPhone ?? ""}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Alamat</span><span className="text-right max-w-[200px]">{detail.address ?? "—"}</span></div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">Ubah Status:</p>
                <div className="flex flex-wrap gap-2">
                  {(["PENDING", "VERIFIED", "ACCEPTED", "REJECTED"] as const).map((s) => (
                    <Button key={s} size="sm" variant={detail.status === s ? "default" : "outline"}
                      className={detail.status === s ? "bg-blue-600 hover:bg-blue-700" : ""}
                      onClick={() => { setStatus(detail.id, s); setDetail({ ...detail, status: s }); }}>
                      {statusLabel[s]}
                    </Button>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setDetail(null)}>Tutup</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
