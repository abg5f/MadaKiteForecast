import ForecastApp from "@/components/ForecastApp"
import { getSpot } from "@/lib/spots"

export default async function Home({ searchParams }: { searchParams: Promise<{ spot?: string }> }) {
  const { spot } = await searchParams
  return <ForecastApp initialSpot={getSpot(spot).id} />
}
