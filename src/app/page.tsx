import WindForecast from "@/components/WindForecast"

function MartiniquFlag({ size = 24 }: { size?: number }) {
  const h = size
  const w = Math.round(size * 1.6)
  return (
    <svg width={w} height={h} viewBox="0 0 160 100" style={{ borderRadius: 3, flexShrink: 0 }}>
      {/* Bande verte (haut) */}
      <rect x="0" y="0"  width="160" height="50" fill="#009A44" />
      {/* Bande noire (bas) */}
      <rect x="0" y="50" width="160" height="50" fill="#1a1a1a" />
      {/* Triangle rouge (gauche) */}
      <polygon points="0,0 70,50 0,100" fill="#CE1126" />
    </svg>
  )
}

export default function Home() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* ── Header ── */}
      <header style={{ backgroundColor: "var(--brand)", padding: "20px 16px 0", flexShrink: 0 }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MartiniquFlag size={28} />
              <div>
                <h1 className="text-white font-bold tracking-tight" style={{ fontSize: 22 }}>
                  Mada Kite Forecast
                </h1>
                <p className="text-white/60 text-sm mt-0.5">Pointe Faula · Martinique</p>
              </div>
            </div>
            <span className="text-white/40 text-xs">prévisions en nœuds</span>
          </div>

          {/* Station live */}
          <div style={{ marginTop: 14, borderRadius: "10px 10px 0 0", overflow: "hidden" }}>
            <iframe
              src="https://www.windguru.cz/wgs-iframe.php?s=4164&wj=knots&tj=c&tmprh=1&avg_min=0&date_format=Y-m-d%20H%3Ai%3As%20T"
              width="100%"
              height="74"
              frameBorder="0"
              scrolling="no"
              title="Station vent Pointe Faula — en direct"
              className="block"
            />
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main
        className="flex-1 py-5 px-4"
        style={{ background: "var(--bg)", overflowY: "auto" }}
      >
        <div className="max-w-2xl mx-auto">
          <WindForecast />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-3 px-4" style={{ borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
          Sources · Open-Meteo · Stormglass · Yr.no · Station Windguru #4164
        </p>
        <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
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
