import { getAcademicYears } from "./actions";
import { AcademicYearTable } from "./AcademicYearTable";

export const dynamic = "force-dynamic";

export default async function AcademicYearsPage() {
  const years = await getAcademicYears().catch(() => []);
  const active = years.find((y) => y.isActive);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Tahun Ajaran & Semester</h1>
        <p className="text-sm text-gray-500">
          {years.length} periode terdaftar
          {active && <> · Aktif: <span className="font-medium text-green-600">{active.year} {active.semester === "GANJIL" ? "Ganjil" : "Genap"}</span></>}
        </p>
      </div>
      <AcademicYearTable years={years} />
    </div>
  );
}
