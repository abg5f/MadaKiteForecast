import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#5C7062",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={108} height={89} viewBox="0 0 50 41">
        <path
          d="M7,28 C5,13 13,4 25,3 C37,4 45,13 43,28 C38,24 25,25 25,25 C25,25 12,24 7,28 Z"
          fill="white"
          opacity="0.96"
        />
        <path
          d="M9,24 C8,12 14,5 25,4 C36,5 42,12 41,24"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.9"
        />
        <line x1="25" y1="3" x2="25" y2="27" stroke="rgba(0,0,0,0.15)" strokeWidth="1.1" />
        <path d="M14,11 Q18,20 20.5,26" stroke="rgba(0,0,0,0.12)" strokeWidth="0.7" fill="none" />
        <path d="M36,11 Q32,20 29.5,26" stroke="rgba(0,0,0,0.12)" strokeWidth="0.7" fill="none" />
        <line x1="25" y1="27" x2="18" y2="35" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" />
        <line x1="25" y1="27" x2="32" y2="35" stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" />
        <line x1="14" y1="35" x2="36" y2="35" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    </div>,
    size
  )
}
