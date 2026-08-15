import { ImageResponse } from "next/og";
import { readSchoolLogo } from "@/server/modules/shared/assets";

const BRAND_COLOR = "#003a9e";

/** Render logo sekolah (atau fallback inisial) sebagai PNG persegi untuk ikon PWA. */
export async function renderPwaIcon(size: number, { maskableSafeArea = false } = {}) {
  const logo = await readSchoolLogo();
  const dataUri = logo ? `data:${logo.contentType};base64,${logo.buffer.toString("base64")}` : null;
  const padding = Math.round(size * (maskableSafeArea ? 0.2 : 0.12));
  const contentSize = size - padding * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLOR,
        }}
      >
        {dataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUri}
            alt=""
            width={contentSize}
            height={contentSize}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: size * 0.42,
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            SH
          </div>
        )}
      </div>
    ),
    { width: size, height: size }
  );
}
