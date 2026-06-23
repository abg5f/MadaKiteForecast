import Header from "@/components/Header"
import WindForecast from "@/components/WindForecast"
import WhatsNew from "@/components/WhatsNew"
import { SpotProvider } from "@/components/SpotProvider"

const INNER = { maxWidth: 780, margin: "0 auto", width: "100%" } as const

export default function Home() {
  return (
    <SpotProvider>
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      <Header />

      <main style={{ flex: 1, background: "var(--bg)", padding: "20px 16px" }}>
        <div style={INNER}>
          <WhatsNew />
          <WindForecast />
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 16px", textAlign: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: 11, color: "var(--muted-text)" }}>
          Open-Meteo · Station Windguru #4164 · Tempest WX #122730
        </p>
        <p style={{ fontSize: 11, color: "var(--muted-text)", marginTop: 3 }}>
          Fait par{" "}
          <a
            href="https://www.instagram.com/paulphotopeche/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}
          >
            Poloduf
          </a>
        </p>
      </footer>
    </div>
    </SpotProvider>
  )
}
