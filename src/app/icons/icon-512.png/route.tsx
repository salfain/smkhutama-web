import { renderPwaIcon } from "@/lib/pwa-icon";

export const revalidate = 3600;

export async function GET() {
  return renderPwaIcon(512);
}
