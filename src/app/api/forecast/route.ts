import { buildForecast } from "@/lib/wind/forecast"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const spot = new URL(request.url).searchParams.get("spot") ?? "faula"
  try {
    const data = await buildForecast(spot)
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
