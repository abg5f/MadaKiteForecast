import WindForecast from "@/components/WindForecast"

export default function Home() {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Faula Wind</h1>
        <p className="text-muted-foreground mt-1 text-sm">Agregateur de previsions · Windy + Windguru</p>
      </div>
      <WindForecast />
    </main>
  )
}
