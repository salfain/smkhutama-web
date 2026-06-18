import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Cek env vars R2
const r2Enabled = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

export const s3 = r2Enabled
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET = process.env.R2_BUCKET_NAME || "";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // URL Custom Domain atau r2.dev

/**
 * Upload file ke Cloudflare R2
 * @param buffer File buffer
 * @param key Lokasi path dalam bucket, misal: 'school/logo.png'
 * @param contentType MIME type file, misal: 'image/png'
 * @returns URL publik file
 */
export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (!s3) {
    throw new Error("Cloudflare R2 is not configured");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // Jika di-set custom domain / r2.dev subdomain, kembalikan URL penuhnya.
  // Jika tidak, fallback ke path lokal agar route parser/proxy kita yang handle.
  if (PUBLIC_URL) {
    return `${PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return `/api/r2-proxy?key=${key}`;
}

/**
 * Hapus file dari Cloudflare R2
 * @param key Lokasi path dalam bucket, misal: 'school/logo.png'
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!s3) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Failed to delete from R2:", error);
  }
}

export { r2Enabled };
