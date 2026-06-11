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
      <header style={{ backgroundColor: "var(--brand)", padding: "20px 16px 0", flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Titre */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MartiniqueFlag size={26} />
              <div>
                <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                  Mada Kite Forecast
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 }}>
                  Pointe Faula · Martinique
                </p>
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              nœuds
            </span>
          </div>

          {/* Station live */}
          <div style={{ marginTop: 16, borderRadius: "10px 10px 0 0", overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
            <iframe
              src="https://www.windguru.cz/wgs-iframe.php?s=4164&wj=knots&tj=c&tmprh=1&avg_min=0&date_format=Y-m-d%20H%3Ai%3As%20T"
              width="100%"
              height="72"
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
          Open-Meteo · Stormglass · Yr.no · Station Windguru #4164
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
