import { ImageResponse } from "next/og";

export const size        = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180, height: 180,
          background: "#0a1628",
          borderRadius: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="110"
          height="140"
          viewBox="0 0 34 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 1 L29 16 L34 24 L17 53 L0 24 L5 16 Z"
            stroke="#f5f1ea"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="0"  y1="24" x2="34" y2="24" stroke="#f5f1ea" strokeWidth="2.5" />
          <line x1="17" y1="1"  x2="10" y2="24" stroke="#f5f1ea" strokeWidth="1.8" />
          <line x1="17" y1="1"  x2="24" y2="24" stroke="#f5f1ea" strokeWidth="1.8" />
          <line x1="5"  y1="16" x2="10" y2="24" stroke="#f5f1ea" strokeWidth="1.8" />
          <line x1="29" y1="16" x2="24" y2="24" stroke="#f5f1ea" strokeWidth="1.8" />
          <line x1="10" y1="24" x2="17" y2="53" stroke="#f5f1ea" strokeWidth="1.8" />
          <line x1="24" y1="24" x2="17" y2="53" stroke="#f5f1ea" strokeWidth="1.8" />
          <path d="M5 16 L0 24 L10 24 Z"  fill="#f5f1ea" fillOpacity="0.25" />
          <path d="M29 16 L34 24 L24 24 Z" fill="#f5f1ea" fillOpacity="0.25" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
