import WindForecast from "@/components/WindForecast"
import LiveStationWidget from "@/components/LiveStationWidget"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Mada Kite Forecast</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Agrégateur de prévisions · Open-Meteo · Stormglass · Yr.no
          </p>
        </div>
        <WindForecast />
      </main>

      <footer className="py-6 px-4 border-t">
        <LiveStationWidget />
        <p className="text-center text-xs text-muted-foreground mt-4">
          Sources : Open-Meteo · Stormglass · Yr.no · Station Windguru #4164
        </p>
      </footer>
    </div>
  )
}
