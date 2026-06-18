import { uploadToR2, r2Enabled } from "./r2";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Upload file wrapper. Otomatis deteksi R2, jika tidak dikonfigurasi akan fallback ke local storage.
 * @param file File objek dari input form (Blob/File)
 * @param subFolder Subfolder tujuan, misal: 'school', 'questions', 'teachers'
 * @param customName Nama file khusus (opsional)
 * @returns string path/URL file yang siap disimpan di database
 */
export async function saveUploadedFile(
  file: Blob | File,
  subFolder: string,
  customName?: string
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Safe type checking untuk nama file
  let fileName = "";
  let ext = "png";
  
  if (file instanceof File && file.name) {
    ext = file.name.split(".").pop() ?? "png";
  }
  
  if (customName) {
    fileName = `${customName}.${ext}`;
  } else {
    fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  }
  
  const key = `${subFolder}/${fileName}`;

  if (r2Enabled) {
    // 1. Upload ke Cloudflare R2
    return await uploadToR2(buffer, key, file.type || "image/png");
  } else {
    // 2. Fallback ke disk lokal server
    const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    return `/uploads/${subFolder}/${fileName}`;
  }
}
