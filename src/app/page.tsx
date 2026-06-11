import WindForecast from "@/components/WindForecast"

export default function Home() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* ── Header ── */}
      <header style={{ backgroundColor: "var(--brand)", padding: "20px 16px 0", flexShrink: 0 }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-white font-bold tracking-tight" style={{ fontSize: 22 }}>
                Mada Kite Forecast
              </h1>
              <p className="text-white/60 text-sm mt-0.5">Pointe Faula · Martinique</p>
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
      </footer>
    </div>
  )
}
