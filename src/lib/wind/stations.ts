import type { Spot } from "@/lib/spots"
import type { StationReading, StationResponse } from "./types"

const MS_TO_KT = 1.94384
const LIVE_MAX_AGE = 30 * 60 // older than this = stale
const STALE_MAX_AGE = 6 * 3600 // older than this = offline

const round1 = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10) / 10)

function statusFor(t: number | null): StationResponse["status"] {
  if (t == null) return "offline"
  const age = Date.now() / 1000 - t
  if (age <= LIVE_MAX_AGE) return "live"
  if (age <= STALE_MAX_AGE) return "stale"
  return "offline"
}

// ── Windguru (balise Airfly, Pointe Faula) ───────────────────────────────────

const WG = "https://www.windguru.cz/int/iapi.php"

function wgHeaders(id: number) {
  return {
    Referer: `https://www.windguru.cz/station/${id}`,
    "User-Agent": "Mozilla/5.0 (compatible; MadaKiteForecast/2.0)",
  }
}

type WgHistory = {
  unixtime?: number[]
  wind_avg?: (number | null)[]
  wind_max?: (number | null)[]
  wind_min?: (number | null)[]
  wind_direction?: (number | null)[]
  temperature?: (number | null)[]
}

type WgCurrent = {
  unixtime?: number
  wind_avg?: number | null
  wind_max?: number | null
  wind_min?: number | null
  wind_direction?: number | null
  temperature?: number | null
}

async function windguruHistory(id: number, hours: number): Promise<{ history: StationReading[]; temperature: number | null }> {
  const to = new Date()
  const from = new Date(to.getTime() - hours * 3600_000)
  const qs = new URLSearchParams({
    q: "station_data",
    id_station: String(id),
    from: from.toISOString().slice(0, 19) + "Z",
    to: to.toISOString().slice(0, 19) + "Z",
    avg_minutes: "10",
  })
  const res = await fetch(`${WG}?${qs}`, { headers: wgHeaders(id), next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Windguru history HTTP ${res.status}`)
  const j = (await res.json()) as WgHistory
  const times = j.unixtime ?? []
  const history = times.map((t, i) => ({
    t,
    avg: round1(j.wind_avg?.[i]),
    min: round1(j.wind_min?.[i]),
    max: round1(j.wind_max?.[i]),
    dir: j.wind_direction?.[i] ?? null,
  }))
  const temps = (j.temperature ?? []).filter((v): v is number => v != null)
  return { history, temperature: temps.length ? temps[temps.length - 1] : null }
}

async function windguruCurrent(id: number): Promise<StationReading | null> {
  const res = await fetch(`${WG}?q=station_data_current&id_station=${id}`, {
    headers: wgHeaders(id),
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Windguru current HTTP ${res.status}`)
  const j = (await res.json()) as WgCurrent
  if (!j.unixtime) return null
  return {
    t: j.unixtime,
    avg: round1(j.wind_avg),
    min: round1(j.wind_min),
    max: round1(j.wind_max),
    dir: j.wind_direction ?? null,
  }
}

/** Station history only (used for model calibration). */
export async function fetchStationHistory(spot: Spot, hours = 48): Promise<StationReading[]> {
  if (spot.station?.kind !== "windguru") return []
  const { history } = await windguruHistory(spot.station.id, hours)
  return history
}

// ── WeatherFlow Tempest (balise CKS, Cap Est) ────────────────────────────────

async function tempestCurrent(deviceId: number): Promise<{ now: StationReading | null; temperature: number | null; battery: number | null }> {
  const token = process.env.CKS_TOKEN
  if (!token) throw new Error("CKS_TOKEN manquant")
  const res = await fetch(`https://swd.weatherflow.com/swd/rest/observations/device/${deviceId}?token=${token}`, {
    next: { revalidate: 120 },
  })
  if (!res.ok) throw new Error(`Tempest HTTP ${res.status}`)
  const j = (await res.json()) as { obs?: (number | null)[][] }
  const o = j.obs?.[0]
  if (!o || o[0] == null) return { now: null, temperature: null, battery: null }
  const kt = (v: number | null) => (v == null ? null : Math.round(v * MS_TO_KT * 10) / 10)
  return {
    now: { t: o[0], min: kt(o[1]), avg: kt(o[2]), max: kt(o[3]), dir: o[4] ?? null },
    temperature: o[7] ?? null,
    battery: o[16] ?? null,
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchStation(spot: Spot): Promise<StationResponse> {
  const base = {
    spot: spot.id,
    label: spot.station?.label ?? null,
    owner: spot.station?.owner ?? null,
  }
  const st = spot.station
  if (!st) return { ...base, status: "none", now: null, history: [], temperature: null, battery: null }

  if (st.kind === "windguru") {
    const [cur, hist] = await Promise.allSettled([windguruCurrent(st.id), windguruHistory(st.id, 12)])
    const history = hist.status === "fulfilled" ? hist.value.history.filter((r) => r.avg != null) : []
    const now = cur.status === "fulfilled" && cur.value ? cur.value : (history.at(-1) ?? null)
    if (!now && cur.status === "rejected" && hist.status === "rejected") throw cur.reason
    return {
      ...base,
      status: statusFor(now?.avg != null ? now.t : null),
      now,
      history,
      temperature: hist.status === "fulfilled" ? hist.value.temperature : null,
      battery: null,
    }
  }

  const { now, temperature, battery } = await tempestCurrent(st.deviceId)
  return {
    ...base,
    status: statusFor(now?.avg != null ? now.t : null),
    now,
    history: [],
    temperature,
    battery,
  }
}
