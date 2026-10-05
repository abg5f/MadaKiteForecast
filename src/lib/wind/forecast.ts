import { getSpot, REFERENCE_SPOT, type Spot } from "@/lib/spots"
import { localDate, localHour } from "@/lib/time"
import { MODELS, type ModelDef } from "./models"
import { fetchStationHistory } from "./stations"
import type { Calibration, ConsensusHour, ForecastResponse, ModelId, ModelSkill, StationReading } from "./types"

// ── Open-Meteo (one request, every model) ────────────────────────────────────

const HOURLY = [
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
  "cloud_cover",
  "precipitation_probability",
  "precipitation",
  "cape",
] as const

type Series = Record<string, (number | null)[] | undefined>

interface RawForecast {
  time: number[]
  hourly: Series
  days: { date: string; sunrise: number; sunset: number }[]
}

async function fetchModels(spot: Spot): Promise<RawForecast> {
  const qs = new URLSearchParams({
    latitude: String(spot.lat),
    longitude: String(spot.lng),
    hourly: HOURLY.join(","),
    daily: "sunrise,sunset",
    models: MODELS.map((m) => m.om).join(","),
    wind_speed_unit: "kn",
    timezone: "America/Martinique",
    timeformat: "unixtime",
    past_days: "2",
    forecast_days: "7",
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${qs}`, { next: { revalidate: 900 } })
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
  const j = await res.json()
  if (j.error) throw new Error(`Open-Meteo : ${j.reason}`)

  const daily = j.daily ?? {}
  const pick = (key: string): (number | null)[] =>
    MODELS.map((m) => daily[`${key}_${m.om}`] as (number | null)[] | undefined).find((s) => s?.some((v) => v != null)) ?? []
  const sunrise = pick("sunrise")
  const sunset = pick("sunset")
  const days = ((daily.time ?? []) as number[]).map((t, i) => ({
    date: localDate(t + 12 * 3600),
    sunrise: sunrise[i] ?? t + 6 * 3600,
    sunset: sunset[i] ?? t + 18 * 3600,
  }))

  return { time: j.hourly?.time ?? [], hourly: j.hourly ?? {}, days }
}

const val = (h: Series, v: string, m: ModelDef, i: number) => h[`${v}_${m.om}`]?.[i] ?? null

// ── Station calibration ──────────────────────────────────────────────────────

interface HourObs {
  avg: number
  /** Strongest gust measured in the hour, when the station reports it. */
  max: number | null
}

/** Station wind in the hour centred on t (model values are instantaneous at t). */
function hourlyObs(history: StationReading[]): Map<number, HourObs> {
  const buckets = new Map<number, StationReading[]>()
  for (const r of history) {
    if (r.avg == null) continue
    const h = Math.round(r.t / 3600) * 3600
    const b = buckets.get(h) ?? []
    b.push(r)
    buckets.set(h, b)
  }
  const out = new Map<number, HourObs>()
  for (const [h, rows] of buckets) {
    if (rows.length < 2) continue
    const maxes = rows.map((r) => r.max).filter((v): v is number => v != null)
    out.set(h, {
      avg: rows.reduce((a, r) => a + r.avg!, 0) / rows.length,
      max: maxes.length ? Math.max(...maxes) : null,
    })
  }
  return out
}

interface Skill {
  bias: number
  /** Multiplicative gust correction (model gusts are often too strong in the trade winds). */
  gustFactor: number
  weight: number
  mae: number | null
  rawMae: number | null
}

const MIN_PAIRS = 6

function measureSkill(raw: RawForecast, obs: Map<number, HourObs>, now: number, strength: number): Map<ModelId, Skill> {
  const skills = new Map<ModelId, Skill>()
  for (const m of MODELS) {
    const pairs: [model: number, obs: number][] = []
    const gustPairs: [model: number, obs: number][] = []
    raw.time.forEach((t, i) => {
      if (t >= now) return
      const h = localHour(t)
      if (h < 7 || h > 18) return // kite hours only: night bias differs (thermal effects)
      const o = obs.get(t)
      const v = val(raw.hourly, "wind_speed_10m", m, i)
      if (o != null && v != null) pairs.push([v, o.avg])
      const g = val(raw.hourly, "wind_gusts_10m", m, i)
      if (o?.max != null && g != null && g > 0) gustPairs.push([g, o.max])
    })

    if (pairs.length < MIN_PAIRS) {
      skills.set(m.id, { bias: 0, gustFactor: 1, weight: m.prior, mae: null, rawMae: null })
      continue
    }
    const n = pairs.length
    const meanErr = pairs.reduce((s, [v, o]) => s + (o - v), 0) / n
    // Shrink toward zero when few hours are available, cap to avoid over-correcting.
    const bias = Math.max(-6, Math.min(6, meanErr * (n / (n + 8)) * strength))
    const rawMae = pairs.reduce((s, [v, o]) => s + Math.abs(o - v), 0) / n
    const mae = pairs.reduce((s, [v, o]) => s + Math.abs(o - (v + bias)), 0) / n
    let gustFactor = 1
    if (gustPairs.length >= MIN_PAIRS) {
      const k = gustPairs.reduce((s, [, o]) => s + o, 0) / gustPairs.reduce((s, [g]) => s + g, 0)
      const gn = gustPairs.length
      gustFactor = Math.max(0.6, Math.min(1.2, 1 + (k - 1) * (gn / (gn + 8)) * strength))
    }
    skills.set(m.id, { bias, gustFactor, weight: m.prior / (mae * mae + 0.5), mae, rawMae })
  }
  return skills
}

// ── Consensus ────────────────────────────────────────────────────────────────

function weightedMean(pairs: [number, number][]): number | undefined {
  const w = pairs.reduce((s, [, wt]) => s + wt, 0)
  return w > 0 ? pairs.reduce((s, [v, wt]) => s + v * wt, 0) / w : undefined
}

const r1 = (v: number) => Math.round(v * 10) / 10

function buildHours(raw: RawForecast, skills: Map<ModelId, Skill>, obs: Map<number, HourObs>, now: number): ConsensusHour[] {
  const today = localDate(now)
  const out: ConsensusHour[] = []

  raw.time.forEach((t, i) => {
    if (localDate(t) < today) return
    const lead = Math.max(0, (t - now) / 3600)
    // Local exposure bias is persistent, but trust it less far ahead.
    const keep = 0.6 + 0.4 * Math.exp(-lead / 36)

    const speeds: [number, number][] = []
    const gusts: [number, number][] = []
    const models: ConsensusHour["models"] = {}
    let sin = 0
    let cos = 0
    const cloud: [number, number][] = []
    const rainP: [number, number][] = []
    const rainMm: [number, number][] = []
    const cape: [number, number][] = []

    for (const m of MODELS) {
      const s = val(raw.hourly, "wind_speed_10m", m, i)
      const d = val(raw.hourly, "wind_direction_10m", m, i)
      if (s == null || d == null) continue
      const sk = skills.get(m.id)!
      const corr = sk.bias * keep
      const speed = Math.max(0, s + corr)
      const w = sk.weight
      speeds.push([speed, w])
      const g = val(raw.hourly, "wind_gusts_10m", m, i)
      const gust = m.hasGust && g != null ? Math.max(speed, g * (1 + (sk.gustFactor - 1) * keep)) : undefined
      if (gust != null) gusts.push([gust, w])
      models[m.id] = { s: Math.round(speed), d: Math.round(d), ...(gust != null && { g: Math.round(gust) }) }
      sin += Math.sin((d * Math.PI) / 180) * w
      cos += Math.cos((d * Math.PI) / 180) * w
      const c = val(raw.hourly, "cloud_cover", m, i)
      if (c != null) cloud.push([c, w])
      const p = val(raw.hourly, "precipitation_probability", m, i)
      if (p != null) rainP.push([p, w])
      const mm = val(raw.hourly, "precipitation", m, i)
      if (mm != null) rainMm.push([mm, w])
      const cp = val(raw.hourly, "cape", m, i)
      if (cp != null) cape.push([cp, w])
    }
    if (speeds.length === 0) return

    const speed = weightedMean(speeds)!
    const wSum = speeds.reduce((s, [, w]) => s + w, 0)
    const spread = Math.sqrt(speeds.reduce((s, [v, w]) => s + w * (v - speed) ** 2, 0) / wSum)
    const gust = Math.max(speed, weightedMean(gusts) ?? speed * 1.3)
    const values = speeds.map(([v]) => v)

    out.push({
      t,
      speed: r1(speed),
      gust: r1(gust),
      dir: Math.round(((Math.atan2(sin, cos) * 180) / Math.PI + 360) % 360),
      spread: r1(spread),
      min: r1(Math.min(...values)),
      max: r1(Math.max(...values)),
      models,
      cloud: cloud.length ? Math.round(weightedMean(cloud)!) : undefined,
      rainProb: rainP.length ? Math.round(weightedMean(rainP)!) : undefined,
      rainMm: rainMm.length ? r1(weightedMean(rainMm)!) : undefined,
      cape: cape.length ? Math.round(weightedMean(cape)!) : undefined,
      obs: obs.has(t) ? r1(obs.get(t)!.avg) : undefined,
    })
  })
  return out
}

// ── Entry point ──────────────────────────────────────────────────────────────

export async function buildForecast(spotId: string): Promise<ForecastResponse> {
  const spot = getSpot(spotId)
  const now = Math.floor(Date.now() / 1000)

  // The spot's own station, else the reference station nearby (regional calibration).
  const own = spot.station?.kind === "windguru"
  const calibSpot = own ? spot : getSpot(REFERENCE_SPOT)

  const [raw, history] = await Promise.all([
    fetchModels(spot),
    fetchStationHistory(calibSpot, 50).catch(() => [] as StationReading[]),
  ])

  const obs = hourlyObs(history)
  const strength = own ? 1 : 0.5
  const skills = measureSkill(raw, obs, now, strength)
  const calibrated = [...skills.values()].some((s) => s.mae != null)

  const hours = buildHours(raw, skills, own ? obs : new Map(), now)

  // Weights as they apply to the next hours (models with data at that time).
  const nextIdx = hours.findIndex((h) => h.t >= now)
  const ref = hours[Math.max(0, nextIdx)]
  const totalW = MODELS.filter((m) => ref?.models[m.id] != null).reduce((s, m) => s + skills.get(m.id)!.weight, 0)

  const models: ModelSkill[] = MODELS.map((m) => {
    const sk = skills.get(m.id)!
    const available = hours.some((h) => h.t >= now && h.models[m.id] != null)
    return {
      id: m.id,
      label: m.label,
      org: m.org,
      available,
      weight: available && ref?.models[m.id] != null && totalW > 0 ? sk.weight / totalW : 0,
      bias: r1(sk.bias),
      mae: sk.mae == null ? null : r1(sk.mae),
      rawMae: sk.rawMae == null ? null : r1(sk.rawMae),
      horizonDays: m.horizonDays,
    }
  })

  const withBias = [...skills.values()].filter((s) => s.rawMae != null)
  const calibration: Calibration = {
    status: !calibrated ? "none" : own ? "station" : "regional",
    stationLabel: calibrated ? (calibSpot.station?.label ?? null) : null,
    hours: obs.size,
    meanBias: withBias.length ? r1(withBias.reduce((s, k) => s + k.bias, 0) / withBias.length / strength) : 0,
  }

  const today = localDate(now)
  return {
    spot: spot.id,
    generatedAt: now,
    hours,
    days: raw.days.filter((d) => d.date >= today),
    models,
    calibration,
  }
}
