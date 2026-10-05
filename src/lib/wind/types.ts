import type { SpotId } from "@/lib/spots"

export type ModelId = "ecmwf" | "aifs" | "arpege" | "icon" | "gfs" | "ukmo" | "gem"

/** One model at one hour, after calibration. s = speed, g = gust, d = direction. */
export interface ModelHour {
  s: number
  g?: number
  d: number
}

/** One forecast hour. Speeds in knots, direction in degrees ("from"), time in unix seconds (UTC). */
export interface ConsensusHour {
  t: number
  speed: number
  gust: number
  dir: number
  /** Weighted standard deviation of model speeds (knots): low = models agree. */
  spread: number
  /** Lowest / highest calibrated model speed this hour. */
  min: number
  max: number
  /** Calibrated values per model, rounded. Missing when a model doesn't cover the hour. */
  models: Partial<Record<ModelId, ModelHour>>
  cloud?: number
  rainProb?: number
  rainMm?: number
  cape?: number
  /** Measured station mean wind for past hours, when available. */
  obs?: number
}

export interface ModelSkill {
  id: ModelId
  label: string
  org: string
  available: boolean
  /** Share of the consensus (0..1), for the near-term hours. */
  weight: number
  /** Additive correction applied (knots), from station comparison. */
  bias: number
  /** Mean absolute error vs station over the calibration window, after correction. */
  mae: number | null
  /** Mean absolute error before correction. */
  rawMae: number | null
  horizonDays: number
}

export interface Calibration {
  status: "station" | "regional" | "none"
  stationLabel: string | null
  hours: number
  /** Mean bias of raw models vs station (knots, + = models too weak). */
  meanBias: number
}

export interface ForecastResponse {
  spot: SpotId
  generatedAt: number
  hours: ConsensusHour[]
  days: { date: string; sunrise: number; sunset: number }[]
  models: ModelSkill[]
  calibration: Calibration
}

export interface StationReading {
  t: number
  avg: number | null
  min: number | null
  max: number | null
  dir: number | null
}

export interface StationResponse {
  spot: SpotId
  status: "live" | "stale" | "offline" | "none"
  label: string | null
  owner: string | null
  now: StationReading | null
  history: StationReading[]
  temperature: number | null
  battery: number | null
}
