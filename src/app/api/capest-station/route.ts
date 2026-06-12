export const dynamic = "force-dynamic"

const STATION_ID = 122730

export async function GET() {
  const token = process.env.WEATHERFLOW_TOKEN
  if (!token) {
    return Response.json({ error: "no_token" }, { status: 503 })
  }

  let raw: Response
  try {
    raw = await fetch(
      `https://swd.weatherflow.com/swd/rest/observations/station/${STATION_ID}?token=${token}`,
      { next: { revalidate: 120 } }
    )
  } catch {
    return Response.json({ error: "fetch_failed" }, { status: 502 })
  }

  if (!raw.ok) {
    return Response.json({ error: `upstream_${raw.status}` }, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await raw.json()
  const obs = data?.obs?.[0]
  if (!obs) {
    return Response.json({ error: "no_data" }, { status: 404 })
  }

  return Response.json(
    {
      windAvg:     Math.round((obs.wind_avg ?? 0)   * 1.944),  // m/s → kts
      windGust:    Math.round((obs.wind_gust ?? 0)  * 1.944),
      windDir:     obs.wind_direction ?? 0,
      temperature: obs.air_temperature ?? null,
      humidity:    obs.relative_humidity ?? null,
      timestamp:   obs.timestamp,
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } }
  )
}
