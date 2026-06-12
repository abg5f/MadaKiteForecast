export type ModelType = "GFS" | "ICON" | "ERA5" | "AROME"
export type SourceName = "openmeteo" | "yr"

export interface HourlyForecast {
  time: string       // ISO timestamp
  windSpeed: number  // knots
  windGust: number   // knots
  windDir: number    // degrees 0-360
  cloudCover?: number   // 0–100 %
  precipProb?: number   // 0–100 % probability
  weatherCode?: number  // WMO weather code
  cape?: number         // J/kg convective instability
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
  yr: SourceForecast | null
  average: SourceForecast | null
  fetchedAt: string
  errors?: Record<string, string>
}

const DEFAULT_LAT = parseFloat(process.env.SPOT_LAT ?? "14.55")
const DEFAULT_LNG = parseFloat(process.env.SPOT_LNG ?? "-60.83")

const OM_MODELS: Record<ModelType, { id: string; label: string }> = {
  GFS:   { id: "gfs_seamless",             label: "GFS · NOAA" },
  ICON:  { id: "icon_seamless",            label: "ICON · DWD" },
  ERA5:  { id: "era5",                     label: "ERA5 · ECMWF" },
  AROME: { id: "meteofrance_arpege_world", label: "AROME · MeteoFrance" },
}

// ---------- Open-Meteo ----------
export async function fetchOpenMeteo(
  model: ModelType,
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
): Promise<SourceForecast> {
  const { id, label } = OM_MODELS[model]

  const qs = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: "windspeed_10m,winddirection_10m,windgusts_10m,cloud_cover,precipitation_probability,weather_code,cape",
    windspeed_unit: "kn",
    timezone: "America/Martinique",
    forecast_days: "7",
    models: id,
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${qs}`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`Open-Meteo (${model}) HTTP ${res.status}`)

  const data = await res.json()
  if (data.error) throw new Error(`Open-Meteo (${model}): ${data.reason}`)

  const times: string[]           = data.hourly?.time ?? []
  const speeds: (number | null)[] = data.hourly?.windspeed_10m ?? []
  const dirs: (number | null)[]   = data.hourly?.winddirection_10m ?? []
  const gusts: (number | null)[]  = data.hourly?.windgusts_10m ?? []
  const clouds: (number | null)[] = data.hourly?.cloud_cover ?? []
  const precips: (number | null)[] = data.hourly?.precipitation_probability ?? []
  const codes: (number | null)[]  = data.hourly?.weather_code ?? []
  const capes: (number | null)[]  = data.hourly?.cape ?? []

  type RawRow = {
    time: string; windSpeed: number | null; windGust: number | null; windDir: number | null
    cloudCover?: number; precipProb?: number; weatherCode?: number; cape?: number
  }

  const forecasts: HourlyForecast[] = (times
    .map((t, i): RawRow => ({
      time: new Date(t).toISOString(),
      windSpeed:   speeds[i]  ?? null,
      windGust:    gusts[i]   ?? speeds[i] ?? null,
      windDir:     dirs[i]    ?? null,
      cloudCover:  clouds[i]  ?? undefined,
      precipProb:  precips[i] ?? undefined,
      weatherCode: codes[i]   ?? undefined,
      cape:        capes[i]   ?? undefined,
    }))
    .filter((f) => f.windSpeed != null && f.windDir != null && f.windGust != null) as HourlyForecast[])
    .map((f) => ({
      ...f,
      windSpeed: Math.round(f.windSpeed),
      windGust:  Math.round(f.windGust),
      windDir:   Math.round(f.windDir),
    }))

  return { source: "openmeteo", model, label, updatedAt: new Date().toISOString(), forecasts }
}

// ---------- Yr.no (Norwegian Met, free, no key) ----------
export async function fetchYr(
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
): Promise<SourceForecast> {
  const res = await fetch(
    `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`,
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
        windSpeed: Math.round(d.wind_speed * 1.944),
        windGust:  Math.round(gust * 1.944),
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

    const withCloud = matches.filter(m => m.cloudCover !== undefined)
    const withPrecip = matches.filter(m => m.precipProb !== undefined)
    const withCode  = matches.filter(m => m.weatherCode !== undefined)
    const withCape  = matches.filter(m => m.cape !== undefined)

    return {
      time: entry.time, windSpeed: avgSpeed, windGust: avgGust, windDir: avgDir,
      cloudCover:  withCloud.length  ? Math.round(withCloud.reduce((s, m)  => s + m.cloudCover!,  0) / withCloud.length)  : undefined,
      precipProb:  withPrecip.length ? Math.round(withPrecip.reduce((s, m) => s + m.precipProb!,  0) / withPrecip.length) : undefined,
      weatherCode: withCode.length   ? Math.max(...withCode.map(m => m.weatherCode!))  : undefined,
      cape:        withCape.length   ? Math.max(...withCape.map(m => m.cape!))          : undefined,
    }
  })

  return { source: "openmeteo", label: "Moyenne", updatedAt: new Date().toISOString(), forecasts }
}
