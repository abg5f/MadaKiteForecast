import { getSpot } from "@/lib/spots"
import { fetchStation } from "@/lib/wind/stations"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const spot = getSpot(new URL(request.url).searchParams.get("spot"))
  try {
    const data = await fetchStation(spot)
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
