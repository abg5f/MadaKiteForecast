import { localDate, localHour } from "@/lib/time"
import { confidence, isOffshore, type Confidence } from "./scale"
import type { ConsensusHour, ForecastResponse } from "./types"

export const KITE_FIRST_HOUR = 7
export const KITE_LAST_HOUR = 18
const GOOD = 14
const LIGHT = 12

export interface DaySummary {
  date: string
  hours: ConsensusHour[]
  peak: number
  peakGust: number
  /** 0..3 */
  stars: number
  window: { from: number; to: number; min: number; max: number; light: boolean } | null
  dir: number
  confidence: Confidence
  confidenceLabel: string
  rainMax: number | null
  storm: boolean
  offshore: boolean
  /** Number of models still covering this day. */
  modelCount: number
}

function longestRun(hours: ConsensusHour[], min: number): ConsensusHour[] {
  let best: ConsensusHour[] = []
  let cur: ConsensusHour[] = []
  for (const h of hours) {
    if (h.speed >= min) {
      cur.push(h)
      if (cur.length > best.length) best = [...cur]
    } else cur = []
  }
  return best
}

function circularMean(dirs: number[]): number {
  const s = dirs.reduce((a, d) => a + Math.sin((d * Math.PI) / 180), 0)
  const c = dirs.reduce((a, d) => a + Math.cos((d * Math.PI) / 180), 0)
  return Math.round(((Math.atan2(s, c) * 180) / Math.PI + 360) % 360)
}

export function kiteHours(data: ForecastResponse, date: string): ConsensusHour[] {
  return data.hours.filter((h) => {
    if (localDate(h.t) !== date) return false
    const lh = localHour(h.t)
    return lh >= KITE_FIRST_HOUR && lh <= KITE_LAST_HOUR
  })
}

export function summarizeDays(data: ForecastResponse, offshore: [number, number]): DaySummary[] {
  return data.days
    .map((d): DaySummary | null => {
      const hours = kiteHours(data, d.date)
      if (hours.length === 0) return null

      const good = longestRun(hours, GOOD)
      const light = longestRun(hours, LIGHT)
      const run = good.length >= 2 ? good : light.length >= 2 ? light : null
      const peak = Math.max(...hours.map((h) => h.speed))
      const peakGust = Math.max(...hours.map((h) => h.gust))
      const meanGood = good.length ? good.reduce((s, h) => s + h.speed, 0) / good.length : 0

      let stars = 0
      if (good.length >= 4 && meanGood >= 17) stars = 3
      else if (good.length >= 3) stars = 2
      else if (light.length >= 2) stars = 1

      const spread = hours.reduce((s, h) => s + h.spread, 0) / hours.length
      const conf = confidence(spread)
      const rain = hours.map((h) => h.rainProb).filter((v): v is number => v != null)
      const rainMax = rain.length ? Math.max(...rain) : null
      const storm = hours.some((h) => (h.cape ?? 0) >= 1000 && (h.rainProb ?? 0) >= 40)
      const windowHours = run ?? []
      const dir = windowHours.length ? circularMean(windowHours.map((h) => h.dir)) : circularMean(hours.map((h) => h.dir))

      return {
        date: d.date,
        hours,
        peak,
        peakGust,
        stars,
        window: run
          ? {
              from: run[0].t,
              to: run[run.length - 1].t,
              min: Math.min(...run.map((h) => h.speed)),
              max: Math.max(...run.map((h) => h.speed)),
              light: run === light && good.length < 2,
            }
          : null,
        dir,
        confidence: conf.level,
        confidenceLabel: conf.label,
        rainMax,
        storm,
        offshore: windowHours.some((h) => isOffshore(h.dir, offshore)),
        modelCount: Math.max(...hours.map((h) => Object.keys(h.models).length)),
      }
    })
    .filter((d): d is DaySummary => d !== null)
}
