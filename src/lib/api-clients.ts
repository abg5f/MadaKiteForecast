export interface HourlyForecast {
  time: string        // ISO timestamp
  windSpeed: number   // km/h
  windGust: number    // km/h
  windDir: number     // degrees 0-360
}

export interface SourceForecast {
  source: "windy" | "windguru"
  updatedAt: string
  forecasts: HourlyForecast[]
}

export interface AggregatedForecast {
  windy: SourceForecast | null
  windguru: SourceForecast | null
  average: SourceForecast | null
  fetchedAt: string
}

const LAT = parseFloat(process.env.SPOT_LAT ?? "14.55")
const LNG = parseFloat(process.env.SPOT_LNG ?? "-60.83")

// ---------- Windy ----------
export async function fetchWindy(): Promise<SourceForecast> {
  const apiKey = process.env.WINDY_API_KEY
  if (!apiKey || apiKey === "your_windy_api_key_here") {
    throw new Error("WINDY_API_KEY not configured")
  }

  const res = await fetch("https://api.windy.com/api/point-forecast/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: LAT,
      lon: LNG,
      model: "gfs",
      parameters: ["wind", "windGust"],
      levels: ["surface"],
      key: apiKey,
    }),
    next: { revalidate: 1800 },
  })

  if (!res.ok) throw new Error(`Windy API error: ${res.status}`)

  const data = await res.json()

  // Windy returns parallel arrays keyed by parameter
  const timestamps: number[] = data.ts ?? []
  const uWind: number[] = data["wind_u-surface"] ?? []
  const vWind: number[] = data["wind_v-surface"] ?? []
  const gusts: number[] = data["windGust-surface"] ?? []

  const forecasts: HourlyForecast[] = timestamps.map((ts, i) => {
    const u = uWind[i] ?? 0
    const v = vWind[i] ?? 0
    const speedMs = Math.sqrt(u * u + v * v)
    const dirRad = Math.atan2(-u, -v)
    const dir = ((dirRad * 180) / Math.PI + 360) % 360

    return {
      time: new Date(ts * 1000).toISOString(),
      windSpeed: Math.round(speedMs * 3.6),
      windGust: Math.round((gusts[i] ?? speedMs) * 3.6),
      windDir: Math.round(dir),
    }
  })

  return { source: "windy", updatedAt: new Date().toISOString(), forecasts }
}

// ---------- Windguru ----------
export async function fetchWindguru(): Promise<SourceForecast> {
  const apiKey = process.env.WINDGURU_API_KEY
  const spotId = process.env.WINDGURU_SPOT_ID ?? "64"

  if (!apiKey || apiKey === "your_windguru_api_key_here") {
    throw new Error("WINDGURU_API_KEY not configured")
  }

  // Windguru v2 JSON API
  const url = `https://www.windguru.cz/int/iapi.php?q=forecast&id_spot=${spotId}&id_model=3&username=api&password=${apiKey}&format=json`
  const res = await fetch(url, { next: { revalidate: 1800 } })

  if (!res.ok) throw new Error(`Windguru API error: ${res.status}`)

  const data = await res.json()

  const hours: number[] = data.fcst?.[0]?.hr_weekno ?? []
  const speeds: number[] = data.fcst?.[0]?.WINDSPD ?? []
  const gusts: number[] = data.fcst?.[0]?.GUST ?? []
  const dirs: number[] = data.fcst?.[0]?.WINDDIR ?? []
  const initDate: string = data.fcst?.[0]?.initdate ?? new Date().toISOString()

  const base = new Date(initDate)

  const forecasts: HourlyForecast[] = hours.map((h, i) => ({
    time: new Date(base.getTime() + h * 3600000).toISOString(),
    windSpeed: Math.round((speeds[i] ?? 0) * 3.6),   // m/s → km/h
    windGust: Math.round((gusts[i] ?? speeds[i] ?? 0) * 3.6),
    windDir: Math.round(dirs[i] ?? 0),
  }))

  return { source: "windguru", updatedAt: new Date().toISOString(), forecasts }
}

// ---------- Average ----------
export function computeAverage(
  windy: SourceForecast | null,
  windguru: SourceForecast | null
): SourceForecast | null {
  const sources = [windy, windguru].filter(Boolean) as SourceForecast[]
  if (sources.length === 0) return null
  if (sources.length === 1) return { ...sources[0], source: "windy" }  // reuse type

  // Align by nearest timestamp within 1h window
  const base = sources[0].forecasts
  const other = sources[1].forecasts

  const averaged: HourlyForecast[] = base.map((entry) => {
    const t = new Date(entry.time).getTime()
    const match = other.reduce((prev, cur) => {
      const da = Math.abs(new Date(prev.time).getTime() - t)
      const db = Math.abs(new Date(cur.time).getTime() - t)
      return db < da ? cur : prev
    })

    const gap = Math.abs(new Date(match.time).getTime() - t)
    if (gap > 3600_000) return entry  // no close match, use base

    // Average angles correctly via unit vectors
    const toRad = (d: number) => (d * Math.PI) / 180
    const avgDir =
      ((Math.atan2(
        (Math.sin(toRad(entry.windDir)) + Math.sin(toRad(match.windDir))) / 2,
        (Math.cos(toRad(entry.windDir)) + Math.cos(toRad(match.windDir))) / 2
      ) *
        180) /
        Math.PI +
        360) %
      360

    return {
      time: entry.time,
      windSpeed: Math.round((entry.windSpeed + match.windSpeed) / 2),
      windGust: Math.round((entry.windGust + match.windGust) / 2),
      windDir: Math.round(avgDir),
    }
  })

  return {
    source: "windy",   // field unused for "average" display
    updatedAt: new Date().toISOString(),
    forecasts: averaged,
  }
}
