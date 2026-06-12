// WeatherFlow public API — station 122730 "CKS MARTINIQUE" (Cap Est, Martinique)
// Station is public (is_public: true). No user token required, only the app api_key.
// api_key source: tempestwx.com/js/main-*.min.js (their web client key)

export const dynamic = "force-dynamic"

const API_KEY   = "6bff2f89-84ab-463c-886e-fc0f443da4cf"
const BASE      = "https://swd.weatherflow.com/swd/rest"
const STATION   = 122730

// obs_st array positions (Tempest all-in-one device)
const IDX = {
  timestamp:   0,
  wind_lull:   1,
  wind_avg:    2,
  wind_gust:   3,
  wind_dir:    4,
  pressure:    6,
  temperature: 7,
  humidity:    8,
  uv:          10,
  battery:     16,
}

function msToKts(ms: number | null): number | null {
  return ms !== null && ms !== undefined ? Math.round(ms * 1.944) : null
}

export async function GET() {
  // Step 1 — get capabilities to find the active wind device_id
  let deviceId: number | null = null
  try {
    const capRes = await fetch(
      `${BASE}/observations/location?api_key=${API_KEY}&location_id=${STATION}`,
      { next: { revalidate: 300 } }
    )
    if (capRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cap: any = await capRes.json()
      const windCap = cap.capabilities?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.capability === "wind"
      )
      if (windCap?.device_id) deviceId = windCap.device_id
    }
  } catch {
    // fall through to hardcoded device
  }

  // Fallback to known device_id (current Tempest hardware at this station)
  if (!deviceId) deviceId = 310915

  // Step 2 — fetch latest observation from device
  let devRes: Response
  try {
    devRes = await fetch(
      `${BASE}/observations/device/${deviceId}?api_key=${API_KEY}`,
      { next: { revalidate: 120 } }
    )
  } catch {
    return Response.json({ error: "fetch_failed" }, { status: 502 })
  }

  if (!devRes.ok) {
    return Response.json({ error: `upstream_${devRes.status}` }, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dev: any = await devRes.json()
  const obs = dev.obs?.[0]
  if (!obs) {
    return Response.json({ error: "no_data" }, { status: 404 })
  }

  return Response.json(
    {
      windAvg:     msToKts(obs[IDX.wind_avg]),
      windGust:    msToKts(obs[IDX.wind_gust]),
      windLull:    msToKts(obs[IDX.wind_lull]),
      windDir:     obs[IDX.wind_dir] ?? null,
      temperature: obs[IDX.temperature] ?? null,
      humidity:    obs[IDX.humidity] ?? null,
      battery:     obs[IDX.battery] ?? null,
      timestamp:   obs[IDX.timestamp],
      deviceId,
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } }
  )
}
