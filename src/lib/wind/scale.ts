// Shared wind helpers (client + server): colour scale, kiteability, direction, kite size.

type Stop = [kts: number, l: number, c: number, h: number]

// Windguru-inspired scale, tuned in OKLCH so steps read evenly.
const STOPS: Stop[] = [
  [0, 0.975, 0.008, 240],
  [6, 0.92, 0.045, 232],
  [10, 0.85, 0.09, 222],
  [13, 0.83, 0.13, 185],
  [16, 0.83, 0.17, 148],
  [20, 0.88, 0.17, 112],
  [24, 0.83, 0.16, 75],
  [28, 0.7, 0.19, 42],
  [33, 0.6, 0.21, 22],
  [40, 0.52, 0.2, 340],
]

function lerp(a: number, b: number, k: number) {
  return a + (b - a) * k
}

function lerpHue(a: number, b: number, k: number) {
  let d = b - a
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return (a + d * k + 360) % 360
}

export function windColor(kts: number): { bg: string; fg: string } {
  const v = Math.max(0, kts)
  let i = STOPS.findIndex((s) => s[0] > v)
  if (i === -1) i = STOPS.length - 1
  if (i === 0) i = 1
  const [k0, l0, c0, h0] = STOPS[i - 1]
  const [k1, l1, c1, h1] = STOPS[i]
  const k = Math.min(1, (v - k0) / (k1 - k0))
  const l = lerp(l0, l1, k)
  const c = lerp(c0, c1, k)
  const h = lerpHue(h0, h1, k)
  return {
    bg: `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`,
    fg: l > 0.66 ? "oklch(0.24 0.03 250)" : "oklch(0.985 0.005 85)",
  }
}

export type Kiteability = "flat" | "light" | "good" | "strong" | "extreme"

export function kiteability(kts: number): { level: Kiteability; label: string } {
  if (kts < 11) return { level: "flat", label: "Trop léger" }
  if (kts < 14) return { level: "light", label: "Léger" }
  if (kts < 25) return { level: "good", label: "Navigable" }
  if (kts < 31) return { level: "strong", label: "Fort" }
  return { level: "extreme", label: "Très fort" }
}

const DIRS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"]

export function dirLabel(deg: number): string {
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
}

export function isOffshore(deg: number, [from, to]: [number, number]): boolean {
  const d = ((deg % 360) + 360) % 360
  return from <= to ? d >= from && d <= to : d >= from || d <= to
}

const KITE_SIZES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17]

/** Rule of thumb for twin-tip: m² ≈ 2.2 × weight(kg) / wind(kts), snapped to common sizes. */
export function kiteSize(weightKg: number, kts: number): number | null {
  if (kts < 11 || kts > 35) return null
  const raw = (2.2 * weightKg) / kts
  return KITE_SIZES.reduce((a, b) => (Math.abs(b - raw) < Math.abs(a - raw) ? b : a))
}

export type Confidence = "high" | "medium" | "low"

export function confidence(spread: number): { level: Confidence; label: string } {
  if (spread <= 2) return { level: "high", label: "Modèles d'accord" }
  if (spread <= 3.5) return { level: "medium", label: "Accord moyen" }
  return { level: "low", label: "Modèles divergents" }
}
