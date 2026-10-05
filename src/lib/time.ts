// Martinique is UTC-4 all year (no DST). All times in the app are unix seconds (UTC).
export const TZ = "America/Martinique"
const OFFSET = -4 * 3600

/** Local hour 0..23 in Martinique. */
export function localHour(t: number): number {
  return new Date((t + OFFSET) * 1000).getUTCHours()
}

/** Local calendar date "YYYY-MM-DD" in Martinique. */
export function localDate(t: number): string {
  return new Date((t + OFFSET) * 1000).toISOString().slice(0, 10)
}

export function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

export function fmtHour(t: number): string {
  return `${String(localHour(t)).padStart(2, "0")}h`
}

export function fmtClock(t: number): string {
  return new Date(t * 1000).toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
}

/** Noon of a local date, used for weekday/day formatting without timezone surprises. */
function noon(date: string): Date {
  return new Date(`${date}T16:00:00Z`)
}

export function fmtWeekday(date: string, style: "short" | "long" = "short"): string {
  return noon(date).toLocaleDateString("fr-FR", { timeZone: TZ, weekday: style }).replace(".", "")
}

export function fmtDayMonth(date: string): string {
  return noon(date).toLocaleDateString("fr-FR", { timeZone: TZ, day: "numeric", month: "long" })
}

export function fmtAgo(t: number, now = nowSec()): string {
  const m = Math.max(0, Math.round((now - t) / 60))
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 48) return `il y a ${h} h`
  return `il y a ${Math.round(h / 24)} jours`
}
