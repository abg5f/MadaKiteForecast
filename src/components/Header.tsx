"use client"

import { useState, useRef, useEffect } from "react"
import AppMenu from "./AppMenu"

// ── SVG ───────────────────────────────────────────────────────────────────────

function KiteLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.82)} viewBox="0 0 50 41" style={{ flexShrink: 0, display: "block" }}>
      <path d="M7,28 C5,13 13,4 25,3 C37,4 45,13 43,28 C38,24 25,25 25,25 C25,25 12,24 7,28 Z" fill="white" opacity="0.95" />
      <path d="M9,24 C8,12 14,5 25,4 C36,5 42,12 41,24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9" />
      <line x1="25" y1="3" x2="25" y2="27" stroke="rgba(0,0,0,0.18)" strokeWidth="1.1" />
      <path d="M14,11 Q18,20 20.5,26" stroke="rgba(0,0,0,0.14)" strokeWidth="0.7" fill="none" />
      <path d="M36,11 Q32,20 29.5,26" stroke="rgba(0,0,0,0.14)" strokeWidth="0.7" fill="none" />
      <line x1="25" y1="27" x2="18" y2="35" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" />
      <line x1="25" y1="27" x2="32" y2="35" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3" />
      <line x1="14" y1="35" x2="36" y2="35" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
}

function MartiniqueFlag({ size = 16 }: { size?: number }) {
  const w = Math.round(size * 1.6)
  return (
    <svg width={w} height={size} viewBox="0 0 160 100" style={{ borderRadius: 2, flexShrink: 0, display: "inline-block", verticalAlign: "middle" }}>
      <rect x="0" y="0" width="160" height="50" fill="#009A44" />
      <rect x="0" y="50" width="160" height="50" fill="#1a1a1a" />
      <polygon points="0,0 70,50 0,100" fill="#CE1126" />
    </svg>
  )
}

// ── Spots ─────────────────────────────────────────────────────────────────────

type Spot = {
  id: string
  name: string
  stationLabel: string
  stationSrc: string
  stationHeight: number
}

const SPOTS: Spot[] = [
  {
    id: "faula",
    name: "Pointe Faula",
    stationLabel: "Balise Live · Airfly",
    stationSrc:
      "https://www.windguru.cz/wgs-iframe.php?s=4164&wj=knots&tj=c&tmprh=1&avg_min=0&date_format=Y-m-d%20H%3Ai%3As%20T",
    stationHeight: 68,
  },
  {
    id: "capest",
    name: "Cap Est",
    stationLabel: "Balise Live · Tempest WX",
    stationSrc: "https://tempestwx.com/station/122730/",
    stationHeight: 240,
  },
]

// ── Header ────────────────────────────────────────────────────────────────────

const INNER: React.CSSProperties = { maxWidth: 780, margin: "0 auto", width: "100%" }

export default function Header() {
  const [spot, setSpot]       = useState<Spot>(SPOTS[0])
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropOpen) return
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [dropOpen])

  return (
    <header style={{ backgroundColor: "var(--brand)", padding: "20px 16px 16px", flexShrink: 0 }}>
      <div style={INNER}>

        {/* Titre + spot + burger */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <KiteLogo size={44} />
            <div>
              <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                Mada Kite Forecast
              </h1>

              {/* Spot selector */}
              <div style={{ position: "relative", marginTop: 3 }} ref={dropRef}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "var(--r-pill)",
                    padding: "3px 10px 3px 10px",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 12, fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2,8 Q5,11 8,8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                  {spot.name}
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ opacity: 0.7 }}>
                    <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0,
                    background: "var(--bg)", borderRadius: "var(--r-card)",
                    boxShadow: "0 10px 32px rgba(0,0,0,0.22)",
                    border: "1px solid var(--border)",
                    minWidth: 180, zIndex: 200, overflow: "hidden",
                  }}>
                    <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid var(--border-soft)" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.07em", color: "var(--muted-text)", margin: 0 }}>
                        Choisir un spot
                      </p>
                    </div>
                    {SPOTS.map((s, idx) => {
                      const active = s.id === spot.id
                      return (
                        <button
                          key={s.id}
                          onClick={() => { setSpot(s); setDropOpen(false) }}
                          style={{
                            width: "100%", padding: "11px 14px",
                            display: "flex", alignItems: "center", gap: 10,
                            textAlign: "left", cursor: "pointer",
                            background: active ? "color-mix(in srgb, var(--brand) 8%, transparent)" : "transparent",
                            border: "none",
                            borderBottom: idx < SPOTS.length - 1 ? "1px solid var(--border-soft)" : "none",
                          }}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                            background: active ? "var(--brand)" : "var(--faint)",
                          }} />
                          <span style={{
                            fontSize: 14, fontWeight: active ? 700 : 400,
                            color: active ? "var(--brand)" : "var(--text)",
                            flex: 1,
                          }}>
                            {s.name}
                          </span>
                          {active && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      )
                    })}
                    <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-soft)" }}>
                      <p style={{ fontSize: 10, color: "var(--muted-text)", margin: 0, lineHeight: 1.4 }}>
                        ·&nbsp;<MartiniqueFlag size={10} />&nbsp;Martinique
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <AppMenu />
        </div>

        {/* Balise Live */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            borderRadius: "var(--r-card)", overflow: "hidden",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            width: "100%", maxWidth: 480,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600, letterSpacing: "0.01em" }}>
                {spot.stationLabel}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#4ade80",
                  display: "inline-block",
                  animation: "live-pulse 1.4s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                  En direct
                </span>
              </div>
            </div>
            <iframe
              key={spot.id}
              src={spot.stationSrc}
              width="100%"
              height={spot.stationHeight}
              frameBorder="0"
              scrolling="no"
              title={`Station vent ${spot.name} — en direct`}
              style={{ display: "block" }}
            />
          </div>
        </div>

      </div>
    </header>
  )
}
