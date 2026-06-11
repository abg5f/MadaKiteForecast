import WindForecast from "@/components/WindForecast"

function MartiniqueFlag({ size = 24 }: { size?: number }) {
  const h = size
  const w = Math.round(size * 1.6)
  return (
    <svg width={w} height={h} viewBox="0 0 160 100" style={{ borderRadius: 3, flexShrink: 0, display: "block" }}>
      <rect x="0" y="0"  width="160" height="50" fill="#009A44" />
      <rect x="0" y="50" width="160" height="50" fill="#1a1a1a" />
      <polygon points="0,0 70,50 0,100" fill="#CE1126" />
    </svg>
  )
}

export default function Home() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: "var(--brand)", padding: "20px 16px 16px", flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Titre app */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MartiniqueFlag size={26} />
              <div>
                <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                  Mada Kite Forecast
                </h1>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 2 }}>
                  Pointe Faula · Martinique
                </p>
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              nœuds
            </span>
          </div>

          {/* ── Balise Live ── */}
          <div style={{
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            {/* Barre titre */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}>
              <span style={{
                color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600,
                letterSpacing: "0.01em",
              }}>
                Balise Live · Airfly
              </span>

              {/* Indicateur EN DIRECT */}
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
      </header>

      {/* ── Contenu ── */}
      <main style={{ flex: 1, overflowY: "auto", background: "var(--bg)", padding: "20px 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <WindForecast />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", textAlign: "center" }}>
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
