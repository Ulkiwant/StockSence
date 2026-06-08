import { ImageResponse } from "next/og";

export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32, height: 32,
          background: "#0a1628",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Diamant en SVG — fond sombre, trait blanc */}
        <svg
          width="20"
          height="26"
          viewBox="0 0 34 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 1 L29 16 L34 24 L17 53 L0 24 L5 16 Z"
            stroke="#f5f1ea"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <line x1="0"  y1="24" x2="34" y2="24" stroke="#f5f1ea" strokeWidth="3" />
          <line x1="17" y1="1"  x2="10" y2="24" stroke="#f5f1ea" strokeWidth="2" />
          <line x1="17" y1="1"  x2="24" y2="24" stroke="#f5f1ea" strokeWidth="2" />
          <line x1="5"  y1="16" x2="10" y2="24" stroke="#f5f1ea" strokeWidth="2" />
          <line x1="29" y1="16" x2="24" y2="24" stroke="#f5f1ea" strokeWidth="2" />
          <line x1="10" y1="24" x2="17" y2="53" stroke="#f5f1ea" strokeWidth="2" />
          <line x1="24" y1="24" x2="17" y2="53" stroke="#f5f1ea" strokeWidth="2" />
          <path d="M5 16 L0 24 L10 24 Z"  fill="#f5f1ea" fillOpacity="0.25" />
          <path d="M29 16 L34 24 L24 24 Z" fill="#f5f1ea" fillOpacity="0.25" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
