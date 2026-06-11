"use client"

import type { HourlyForecast } from "@/lib/api-clients"

// ── helpers ──────────────────────────────────────────────────────────────────

function starsFor(kts: number): number {
  if (kts < 10) return 0
  if (kts < 12) return 1
  if (kts < 14) return 2
  return 3
}

interface DayStats {
  maxSpeed: number
  stars: number
  windowStart: string
  windowEnd: string
}

function computeDay(rows: HourlyForecast[]): DayStats | null {
  // Find the best consecutive block where speed >= 10 kts
  const blocks: HourlyForecast[][] = []
  let cur: HourlyForecast[] = []
  for (const r of rows) {
    if (r.windSpeed >= 10) {
      cur.push(r)
    } else {
      if (cur.length) { blocks.push(cur); cur = [] }
    }
  }
  if (cur.length) blocks.push(cur)
  if (!blocks.length) return null

  const best = blocks.reduce((a, b) =>
    Math.max(...b.map(r => r.windSpeed)) > Math.max(...a.map(r => r.windSpeed)) ? b : a
  )

  const maxSpeed = Math.max(...best.map(r => r.windSpeed))
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  return {
    maxSpeed,
    stars: starsFor(maxSpeed),
    windowStart: fmt(best[0].time),
    windowEnd: fmt(best[best.length - 1].time),
  }
}

function groupByDay(forecasts: HourlyForecast[]) {
  const map = new Map<string, HourlyForecast[]>()
  for (const f of forecasts) {
    const key = new Date(f.time).toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }))
}

// ── sub-components ────────────────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            fontSize: 18,
            lineHeight: 1,
            color: i <= count ? "#f59e0b" : "var(--faint)",
            transition: "color 0.15s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function DayRow({ dateKey, stats }: { dateKey: string; stats: DayStats | null }) {
  const d = new Date(dateKey + "T12:00:00")
  const todayKey = new Date().toISOString().slice(0, 10)
  const isToday = dateKey === todayKey

  const weekday = d.toLocaleDateString("fr-FR", { weekday: "short" })
  const dayNum  = d.toLocaleDateString("fr-FR", { day: "numeric" })
  const month   = d.toLocaleDateString("fr-FR", { month: "short" })

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-soft)",
        background: isToday
          ? "color-mix(in srgb, var(--brand) 6%, transparent)"
          : "transparent",
      }}
    >
      {/* Jour */}
      <div style={{ width: 72, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isToday ? "var(--brand)" : "var(--text)",
            textTransform: "capitalize",
          }}
        >
          {weekday}.
        </span>
        {isToday && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "var(--r-pill)",
              background: "var(--brand)",
              color: "#fff",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            auj.
          </span>
        )}
        <div style={{ fontSize: 11, color: "var(--muted-text)", marginTop: 1 }}>
          {dayNum} {month}
        </div>
      </div>

      {/* Étoiles */}
      <Stars count={stats?.stars ?? 0} />

      {/* Vitesse + créneau */}
      <div style={{ flex: 1, textAlign: "right" }}>
        {stats ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 3 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
                {stats.maxSpeed}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted-text)" }}>kts</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted-text)", marginTop: 2 }}>
              {stats.windowStart} – {stats.windowEnd}
            </div>
          </>
        ) : (
          <span style={{ fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>
            Vent faible
          </span>
        )}
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  forecasts: HourlyForecast[]
  sourceLabel: string
}

export default function WeekCalendar({ forecasts, sourceLabel }: Props) {
  const groups = groupByDay(forecasts)

  if (groups.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          background: "var(--card)",
          borderRadius: "var(--r-card)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.25, marginBottom: 8 }}>📅</div>
        <p style={{ color: "var(--muted-text)" }}>Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div>
      {/* Légende */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { stars: 1, label: "10–12 kts" },
            { stars: 2, label: "12–14 kts" },
            { stars: 3, label: "≥ 14 kts" },
          ].map(({ stars, label }) => (
            <div key={stars} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Stars count={stars} />
              <span style={{ fontSize: 10, color: "var(--muted-text)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "var(--muted-text)", fontWeight: 500 }}>
          {sourceLabel}
        </span>
      </div>

      {/* Carte 7 jours */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-card)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        {groups.map(({ key, rows }) => (
          <DayRow key={key} dateKey={key} stats={computeDay(rows)} />
        ))}
      </div>

      {/* Note étoiles */}
      <p style={{ fontSize: 11, color: "var(--faint)", textAlign: "center", marginTop: 10 }}>
        Basé sur le pic horaire · Aucune étoile sous 10 kts
      </p>
    </div>
  )
}
