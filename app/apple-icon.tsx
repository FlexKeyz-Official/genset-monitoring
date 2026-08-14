import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" fill="#34d399" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
