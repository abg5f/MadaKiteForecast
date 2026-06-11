export type ModelType = "GFS" | "ICON" | "ERA5" | "AROME"
export type SourceName = "openmeteo" | "stormglass" | "yr"

export interface HourlyForecast {
  time: string       // ISO timestamp
  windSpeed: number  // km/h
  windGust: number   // km/h
  windDir: number    // degrees 0-360
}

export interface SourceForecast {
  source: SourceName
  model?: ModelType
  label: string
  updatedAt: string
  forecasts: HourlyForecast[]
}

export interface AggregatedForecast {
  openMeteo: Partial<Record<ModelType, SourceForecast | null>>
  stormglass: SourceForecast | null
  yr: SourceForecast | null
  average: SourceForecast | null
  fetchedAt: string
  errors?: Record<string, string>
}

const LAT = parseFloat(process.env.SPOT_LAT ?? "14.55")
const LNG = parseFloat(process.env.SPOT_LNG ?? "-60.83")

const OM_MODELS: Record<ModelType, { id: string; label: string }> = {
  GFS:   { id: "gfs_seamless",             label: "GFS · NOAA" },
  ICON:  { id: "icon_seamless",            label: "ICON · DWD" },
  ERA5:  { id: "era5",                     label: "ERA5 · ECMWF" },
  AROME: { id: "meteofrance_arpege_world", label: "AROME · MeteoFrance" },
}

// ---------- Open-Meteo ----------
export async function fetchOpenMeteo(model: ModelType): Promise<SourceForecast> {
  const { id, label } = OM_MODELS[model]

  const qs = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LNG),
    hourly: "windspeed_10m,winddirection_10m,windgusts_10m",
    windspeed_unit: "kmh",
    timezone: "America/Martinique",
    forecast_days: "7",
    models: id,
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${qs}`, {
    next: { revalidate: 1800 },
  })

  if (!res.ok) throw new Error(`Open-Meteo (${model}) HTTP ${res.status}`)

  const data = await res.json()
  if (data.error) throw new Error(`Open-Meteo (${model}): ${data.reason}`)

  const times: string[]           = data.hourly?.time ?? []
  const speeds: (number | null)[] = data.hourly?.windspeed_10m ?? []
  const dirs: (number | null)[]   = data.hourly?.winddirection_10m ?? []
  const gusts: (number | null)[]  = data.hourly?.windgusts_10m ?? []

  const forecasts: HourlyForecast[] = times
    .map((t, i) => ({
      time: new Date(t).toISOString(),
      windSpeed: speeds[i] ?? null,
      windGust:  gusts[i]  ?? speeds[i] ?? null,
      windDir:   dirs[i]   ?? null,
    }))
    .filter((f): f is HourlyForecast =>
      f.windSpeed != null && f.windDir != null && f.windGust != null
    )
    .map((f) => ({
      ...f,
      windSpeed: Math.round(f.windSpeed),
      windGust:  Math.round(f.windGust),
      windDir:   Math.round(f.windDir),
    }))

  return { source: "openmeteo", model, label, updatedAt: new Date().toISOString(), forecasts }
}

// ---------- Stormglass (10 req/day free → in-memory 6h cache) ----------
let _sgCache: { data: SourceForecast; ts: number } | null = null
const SG_TTL = 6 * 3600_000

export async function fetchStormglass(): Promise<SourceForecast> {
  const now = Date.now()
  if (_sgCache && now - _sgCache.ts < SG_TTL) return _sgCache.data

  const apiKey = process.env.STORMGLASS_API_KEY
  if (!apiKey) throw new Error("STORMGLASS_API_KEY not configured")

  const start = Math.floor(now / 1000)
  const end   = start + 7 * 86400

  const qs = new URLSearchParams({
    lat: String(LAT),
    lng: String(LNG),
    params: "windSpeed,windDirection,gust",
    start: String(start),
    end:   String(end),
  })

  const res = await fetch(`https://api.stormglass.io/v2/weather/point?${qs}`, {
    headers: { Authorization: apiKey },
  })

  if (!res.ok) throw new Error(`Stormglass HTTP ${res.status}`)

  const data = await res.json()

  const pickSg = (arr: { source: string; value: number }[] | undefined) =>
    (arr?.find((x) => x.source === "sg") ?? arr?.[0])?.value ?? null

  const forecasts: HourlyForecast[] = (data.hours ?? [])
    .map((h: { time: string; windSpeed: { source: string; value: number }[]; windDirection: { source: string; value: number }[]; gust: { source: string; value: number }[] }) => {
      const speedMs = pickSg(h.windSpeed)
      const dir     = pickSg(h.windDirection)
      const gustMs  = pickSg(h.gust)
      if (speedMs == null || dir == null) return null
      return {
        time:      new Date(h.time).toISOString(),
        windSpeed: Math.round(speedMs * 3.6),
        windGust:  Math.round((gustMs ?? speedMs) * 3.6),
        windDir:   Math.round(dir),
      }
    })
    .filter(Boolean) as HourlyForecast[]

  const result: SourceForecast = {
    source: "stormglass",
    label: "Stormglass",
    updatedAt: new Date().toISOString(),
    forecasts,
  }
  _sgCache = { data: result, ts: now }
  return result
}

// ---------- Yr.no (Norwegian Met, free, no key) ----------
export async function fetchYr(): Promise<SourceForecast> {
  const res = await fetch(
    `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LNG}`,
    {
      headers: { "User-Agent": "MadaKiteForecast/1.0 github.com/abg5f/MadaKiteForecast" },
      next: { revalidate: 1800 },
    }
  )

  if (!res.ok) throw new Error(`Yr.no HTTP ${res.status}`)

  const data = await res.json()

  const forecasts: HourlyForecast[] = (data.properties?.timeseries ?? [])
    .map((entry: { time: string; data: { instant: { details: { wind_speed?: number; wind_from_direction?: number; wind_speed_of_gust?: number } }; next_1_hours?: { details?: { wind_speed_of_gust?: number } } } }) => {
      const d = entry.data?.instant?.details
      if (!d?.wind_speed || d?.wind_from_direction == null) return null
      const gust =
        entry.data?.next_1_hours?.details?.wind_speed_of_gust ?? d.wind_speed
      return {
        time:      new Date(entry.time).toISOString(),
        windSpeed: Math.round(d.wind_speed * 3.6),
        windGust:  Math.round(gust * 3.6),
        windDir:   Math.round(d.wind_from_direction),
      }
    })
    .filter(Boolean) as HourlyForecast[]

  return {
    source: "yr",
    label: "Yr · Met Norway",
    updatedAt: new Date().toISOString(),
    forecasts,
  }
}

// ---------- Multi-source average (circular mean for direction) ----------
export function computeAverage(sources: (SourceForecast | null)[]): SourceForecast | null {
  const valid = sources.filter((s): s is SourceForecast => s != null && s.forecasts.length > 0)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]

  const toRad = (d: number) => (d * Math.PI) / 180
  const base  = valid[0].forecasts

  const forecasts: HourlyForecast[] = base.map((entry) => {
    const t = new Date(entry.time).getTime()
    const matches: HourlyForecast[] = [entry]

    for (let i = 1; i < valid.length; i++) {
      const closest = valid[i].forecasts.reduce((a, b) =>
        Math.abs(new Date(b.time).getTime() - t) < Math.abs(new Date(a.time).getTime() - t) ? b : a
      )
      if (Math.abs(new Date(closest.time).getTime() - t) <= 3600_000) matches.push(closest)
    }

    const n         = matches.length
    const avgSpeed  = Math.round(matches.reduce((s, m) => s + m.windSpeed, 0) / n)
    const avgGust   = Math.round(matches.reduce((s, m) => s + m.windGust, 0) / n)
    const sinSum    = matches.reduce((s, m) => s + Math.sin(toRad(m.windDir)), 0)
    const cosSum    = matches.reduce((s, m) => s + Math.cos(toRad(m.windDir)), 0)
    const avgDir    = Math.round(((Math.atan2(sinSum / n, cosSum / n) * 180) / Math.PI + 360) % 360)

    return { time: entry.time, windSpeed: avgSpeed, windGust: avgGust, windDir: avgDir }
  })

  return { source: "openmeteo", label: "Moyenne", updatedAt: new Date().toISOString(), forecasts }
}
