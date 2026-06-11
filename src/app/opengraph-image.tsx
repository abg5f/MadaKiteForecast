import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Mada Kite Forecast — Prévisions kitesurf Martinique"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #2e4035 0%, #3d5244 50%, #4a6052 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Decorative background arcs */}
      <div style={{
        position: "absolute",
        width: 1000, height: 1000,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.05)",
        top: 115, left: 100,
        display: "flex",
      }} />
      <div style={{
        position: "absolute",
        width: 1300, height: 1300,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.03)",
        top: -35, left: -50,
        display: "flex",
      }} />
      <div style={{
        position: "absolute",
        width: 700, height: 700,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.06)",
        top: 265, left: 250,
        display: "flex",
      }} />

      {/* Left ambient glow */}
      <div style={{
        position: "absolute",
        width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(92,112,98,0.35) 0%, transparent 70%)",
        top: -100, left: -100,
        display: "flex",
      }} />

      {/* Main content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}>

        {/* Kite SVG logo */}
        <svg width="150" height="120" viewBox="0 0 50 40" style={{ marginBottom: 32 }}>
          {/* Main wing shape */}
          <path
            d="M7,28 C5,13 13,4 25,3 C37,4 45,13 43,28 C38,24 25,25 25,25 C25,25 12,24 7,28 Z"
            fill="white"
            opacity="0.95"
          />
          {/* Leading edge highlight */}
          <path
            d="M9,24 C8,12 14,5 25,4 C36,5 42,12 41,24"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
          />
          {/* Center strut */}
          <line x1="25" y1="3" x2="25" y2="27" stroke="#3a4e40" strokeWidth="1.2" />
          {/* Left strut */}
          <path d="M 14,11 Q 18,20 20.5,26" stroke="#3a4e40" strokeWidth="0.7" fill="none" opacity="0.8" />
          {/* Right strut */}
          <path d="M 36,11 Q 32,20 29.5,26" stroke="#3a4e40" strokeWidth="0.7" fill="none" opacity="0.8" />
          {/* Lines to bar */}
          <line x1="25" y1="27" x2="18" y2="34" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3" />
          <line x1="25" y1="27" x2="32" y2="34" stroke="rgba(255,255,255,0.65)" strokeWidth="1.3" />
          {/* Control bar */}
          <line x1="14" y1="34" x2="36" y2="34" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        </svg>

        {/* Title */}
        <div style={{
          color: "white",
          fontSize: 78,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          textAlign: "center",
          marginBottom: 18,
        }}>
          Mada Kite Forecast
        </div>

        {/* Tagline */}
        <div style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 26,
          fontWeight: 400,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          marginBottom: 44,
          textAlign: "center",
        }}>
          Pointe Faula · Martinique
        </div>

        {/* Source badges */}
        <div style={{ display: "flex", gap: 14 }}>
          {["🌊 Open-Meteo", "🇳🇴 Yr.no", "📡 Balise live"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 24px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.72)",
                fontSize: 20,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>,
    size
  )
}
