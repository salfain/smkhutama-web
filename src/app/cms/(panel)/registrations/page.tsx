import { getRegistrations } from "../content-actions";
import { RegistrationsClient } from "./RegistrationsClient";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const regs = await getRegistrations().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Pendaftar PPDB</h1>
        <p className="text-sm text-gray-500">{regs.length} pendaftar · {regs.filter((r) => r.status === "PENDING").length} menunggu verifikasi</p>
      </div>
      <RegistrationsClient registrations={regs.map((r) => ({
        id: r.id,
        registNumber: r.registNumber,
        fullName: r.fullName,
        nisn: r.nisn,
        gender: r.gender,
        phone: r.phone,
        email: r.email,
        originSchool: r.originSchool,
        selectedMajor: r.selectedMajor,
        parentName: r.parentName,
        parentPhone: r.parentPhone,
        address: r.address,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))} />
    </div>
  );
}
