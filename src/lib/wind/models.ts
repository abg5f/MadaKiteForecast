import type { ModelId } from "./types"

export interface ModelDef {
  id: ModelId
  /** Open-Meteo model identifier. */
  om: string
  label: string
  org: string
  /** Prior weight when no station is available to measure skill (global verification scores). */
  prior: number
  hasGust: boolean
  horizonDays: number
}

// Models that actually cover Martinique on Open-Meteo. AROME (France / Antilles) is not
// distributed there, so Météo-France is represented by ARPEGE (≈ 0.1° over the tropics).
export const MODELS: ModelDef[] = [
  { id: "ecmwf", om: "ecmwf_ifs", label: "ECMWF IFS", org: "Centre européen", prior: 1.3, hasGust: true, horizonDays: 7 },
  { id: "aifs", om: "ecmwf_aifs025_single", label: "ECMWF AIFS", org: "IA du Centre européen", prior: 1.2, hasGust: false, horizonDays: 7 },
  { id: "arpege", om: "meteofrance_seamless", label: "ARPEGE", org: "Météo-France", prior: 1.1, hasGust: true, horizonDays: 4 },
  { id: "icon", om: "icon_seamless", label: "ICON", org: "DWD Allemagne", prior: 1.0, hasGust: true, horizonDays: 7 },
  { id: "ukmo", om: "ukmo_global_deterministic_10km", label: "UKMO", org: "Met Office", prior: 1.0, hasGust: true, horizonDays: 7 },
  { id: "gfs", om: "gfs_seamless", label: "GFS", org: "NOAA États-Unis", prior: 0.9, hasGust: true, horizonDays: 7 },
  { id: "gem", om: "gem_global", label: "GEM", org: "Environnement Canada", prior: 0.7, hasGust: true, horizonDays: 7 },
]
