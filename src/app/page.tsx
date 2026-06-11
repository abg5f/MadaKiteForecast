import WindForecast from "@/components/WindForecast"
import FAQ from "@/components/FAQ"

function KiteLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.82)} viewBox="0 0 50 41" style={{ flexShrink: 0, display: "block" }}>
      <path
        d="M7,28 C5,13 13,4 25,3 C37,4 45,13 43,28 C38,24 25,25 25,25 C25,25 12,24 7,28 Z"
        fill="white" opacity="0.95"
      />
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
  const h = size
  const w = Math.round(size * 1.6)
  return (
    <svg width={w} height={h} viewBox="0 0 160 100" style={{ borderRadius: 2, flexShrink: 0, display: "inline-block", verticalAlign: "middle" }}>
      <rect x="0" y="0"  width="160" height="50" fill="#009A44" />
      <rect x="0" y="50" width="160" height="50" fill="#1a1a1a" />
      <polygon points="0,0 70,50 0,100" fill="#CE1126" />
    </svg>
  )
}

const INNER = { maxWidth: 780, margin: "0 auto", width: "100%" } as const

export default function Home() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: "var(--brand)", padding: "20px 16px 16px", flexShrink: 0 }}>
        <div style={INNER}>

          {/* Titre */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <KiteLogo size={44} />
              <div>
                <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                  Mada Kite Forecast
                </h1>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                  Pointe Faula ·&nbsp;<MartiniqueFlag size={13} />&nbsp;Martinique
                </p>
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              nœuds
            </span>
          </div>

          {/* ── Balise Live ── */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              borderRadius: "var(--r-card)",
              overflow: "hidden",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              width: "100%",
              maxWidth: 480,
            }}>
              {/* Barre titre */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600, letterSpacing: "0.01em" }}>
                  Balise Live · Airfly
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#4ade80",
                    display: "inline-block",
                    animation: "live-pulse 1.4s ease-in-out infinite",
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
                  }}>
                    En direct
                  </span>
                </div>
              </div>

              {/* Iframe station */}
              <iframe
                src="https://www.windguru.cz/wgs-iframe.php?s=4164&wj=knots&tj=c&tmprh=1&avg_min=0&date_format=Y-m-d%20H%3Ai%3As%20T"
                width="100%"
                height="68"
                frameBorder="0"
                scrolling="no"
                title="Station vent Pointe Faula — en direct"
                style={{ display: "block" }}
              />
            </div>
          </div>

        </div>
      </header>

      {/* ── Prévisions ── */}
      <main style={{ flex: 1, background: "var(--bg)", padding: "20px 16px" }}>
        <div style={INNER}>
          <WindForecast />
        </div>
      </main>

      {/* ── FAQ ── */}
      <section style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        padding: "28px 16px 40px",
      }}>
        <div style={INNER}>
          <FAQ />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 16px", textAlign: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: 11, color: "var(--muted-text)" }}>
          Open-Meteo · Yr.no · Station Windguru #4164
        </p>
        <p style={{ fontSize: 11, color: "var(--muted-text)", marginTop: 3 }}>
          Fait par{" "}
          <a
            href="https://www.instagram.com/poloduf_fishing/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}
          >
            Poloduf
          </a>
        </p>
      </footer>
    </div>
  )
}
