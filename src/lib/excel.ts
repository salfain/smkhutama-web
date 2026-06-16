import ExcelJS from "exceljs";

/** Generate Excel buffer dari array of objects */
export async function generateExcel(
  sheetName: string,
  columns: { header: string; key: string; width?: number }[],
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 20,
  }));

  // Style header
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D4ED8" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  ws.getRow(1).height = 28;

  // Data rows
  rows.forEach((r) => ws.addRow(r));

  // Border semua cell
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** Parse Excel file to JSON rows */
export async function parseExcel(
  arrayBuffer: ArrayBuffer
): Promise<Record<string, string>[]> {
  const wb = new ExcelJS.Workbook();
  const os = await import("os");
  const path = await import("path");
  const { writeFile: wf, unlink } = await import("fs/promises");
  const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}.xlsx`);
  await wf(tmpPath, Buffer.from(arrayBuffer));
  await wb.xlsx.readFile(tmpPath);
  await unlink(tmpPath).catch(() => {});
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const headers: string[] = [];
  const rows: Record<string, string>[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        headers.push(String(cell.value ?? "").trim());
      });
      return;
    }
    const obj: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const key = headers[colNum - 1];
      if (key) obj[key] = String(cell.value ?? "").trim();
    });
    if (Object.values(obj).some((v) => v)) rows.push(obj);
  });

  return rows;
}
