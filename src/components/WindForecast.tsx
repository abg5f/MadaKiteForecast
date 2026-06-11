"use client"

import { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react"
import FilterToggle, { type SourceFilter } from "./FilterToggle"
import WeekCalendar from "./WeekCalendar"
import type { AggregatedForecast, HourlyForecast, ModelType } from "@/lib/api-clients"

const POLL_INTERVAL = 30 * 60 * 1000

// Open-Meteo returns "America/Martinique" local times stored as UTC on the server (UTC+0).
// So getUTCHours() gives back the Martinique hour. Current MQ hour = UTC - 4.
function getMartiniqueState() {
  const now = new Date()
  const todayKey = now.toLocaleDateString("en-CA", { timeZone: "America/Martinique" })
  const currentHour = (now.getUTCHours() - 4 + 24) % 24
  return { todayKey, currentHour }
}

// ── Wind scale (knots) ────────────────────────────────────────────────────────

function windCond(kts: number) {
  if (kts < 8)  return { label: "Calme",     bg: "var(--surface)",      color: "var(--muted-text)" }
  if (kts < 14) return { label: "Léger",     bg: "var(--info-soft)",    color: "var(--info)" }
  if (kts < 22) return { label: "Idéal",     bg: "var(--success-soft)", color: "var(--success)" }
  if (kts < 30) return { label: "Fort",      bg: "var(--warning-soft)", color: "var(--warning)" }
  if (kts < 38) return { label: "Très fort", bg: "#ffedd5",             color: "#c2410c" }
  return              { label: "Danger",     bg: "var(--danger-soft)",  color: "var(--danger)" }
}

const DIR = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
const dirLabel = (deg: number) => DIR[Math.round(deg / 45) % 8]

// ── View toggle ───────────────────────────────────────────────────────────────

type AppView = "forecast" | "calendar"

function ViewToggle({ view, onChange }: { view: AppView; onChange: (v: AppView) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const [g, setG] = useState({ left: 0, width: 0 })
  const idx = view === "forecast" ? 0 : 1

  useLayoutEffect(() => {
    const el = refs.current[idx]
    if (el) setG({ left: el.offsetLeft, width: el.offsetWidth })
  }, [idx])

  const opts: { value: AppView; label: string }[] = [
    { value: "forecast", label: "Prévisions" },
    { value: "calendar", label: "Calendrier" },
  ]

  return (
    <div style={{
      position: "relative", display: "flex", flex: 1,
      background: "var(--surface)", borderRadius: "var(--r-pill)", padding: 3,
    }}>
      <div aria-hidden style={{
        position: "absolute", top: 3,
        left: g.left, width: g.width, height: 36,
        borderRadius: "var(--r-pill)", background: "var(--brand)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transition: "left .22s cubic-bezier(.4,0,.2,1), width .22s cubic-bezier(.4,0,.2,1)",
        pointerEvents: "none",
      }} />
      {opts.map((o, i) => (
        <button
          key={o.value}
          ref={el => { refs.current[i] = el }}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1, height: 36, borderRadius: "var(--r-pill)",
            border: "none", background: "transparent",
            color: view === o.value ? "#fff" : "var(--muted-text)",
            fontWeight: view === o.value ? 600 : 400,
            fontSize: 14, cursor: "pointer",
            position: "relative", zIndex: 1,
            transition: "color .18s",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Forecast rows ─────────────────────────────────────────────────────────────

function groupByDay(forecasts: HourlyForecast[]) {
  const map = new Map<string, HourlyForecast[]>()
  for (const f of forecasts) {
    const key = new Date(f.time).toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }))
}

function ForecastRow({
  f, isPast, isNow,
}: {
  f: HourlyForecast; isPast?: boolean; isNow?: boolean
}) {
  const cond = windCond(f.windSpeed)
  const h = new Date(f.time).getUTCHours()
  const hour = `${String(h).padStart(2, "0")}:00`

  return (
    <div
      id={isNow ? "forecast-current" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-soft)",
        opacity: isPast ? 0.35 : 1,
        position: "relative",
      }}
    >
      {isNow && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: 3, borderRadius: "0 2px 2px 0",
          background: "var(--brand)",
        }} />
      )}

      <span style={{
        width: 44, flexShrink: 0, fontSize: 13,
        fontWeight: isNow ? 700 : 500,
        color: isNow ? "var(--brand)" : "var(--text-2)",
      }}>
        {hour}
      </span>

      <div style={{ width: 36, flexShrink: 0, textAlign: "center" }}>
        <div style={{
          fontSize: 14, lineHeight: 1,
          color: isPast ? "var(--muted-text)" : "var(--brand)",
          display: "inline-block",
          transform: `rotate(${f.windDir}deg)`,
        }}>↑</div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "var(--muted-text)", marginTop: 1 }}>
          {dirLabel(f.windDir)}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{
          fontSize: 22, fontWeight: 700, lineHeight: 1,
          color: isPast ? "var(--muted-text)" : "var(--text)",
        }}>
          {f.windSpeed}
        </span>
        <span style={{ fontSize: 11, color: "var(--muted-text)" }}>kts</span>
        {f.windGust > f.windSpeed + 2 && (
          <span style={{ fontSize: 12, color: "var(--label)", marginLeft: 4 }}>
            rafales <strong style={{ color: isPast ? "var(--muted-text)" : "var(--text-2)", fontWeight: 600 }}>
              {f.windGust}
            </strong>
          </span>
        )}
      </div>

      <span style={{
        fontSize: 11, fontWeight: 700,
        padding: "3px 10px", borderRadius: "var(--r-pill)",
        background: isPast ? "var(--surface)" : cond.bg,
        color: isPast ? "var(--muted-text)" : cond.color,
        flexShrink: 0,
      }}>
        {cond.label}
      </span>
    </div>
  )
}

function DayCard({
  label, rows, dayKey, todayKey, currentHour,
}: {
  label: string; rows: HourlyForecast[]
  dayKey: string; todayKey: string; currentHour: number
}) {
  const isToday = dayKey === todayKey
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-card)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "7px 16px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "var(--label)", flex: 1,
        }}>
          {label}
        </span>
        {isToday && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px",
            borderRadius: "var(--r-pill)", background: "var(--brand)",
            color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            Aujourd'hui
          </span>
        )}
      </div>
      {rows.map(f => {
        const h = new Date(f.time).getUTCHours()
        return (
          <ForecastRow
            key={f.time}
            f={f}
            isPast={isToday && h < currentHour}
            isNow={isToday && h === currentHour}
          />
        )
      })}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          height: 52, borderRadius: "var(--r-card)",
          background: "var(--surface)", opacity: 1 - i * 0.12,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function WindForecast() {
  const [data, setData]       = useState<AggregatedForecast | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState<AppView>("forecast")
  const [source, setSource]   = useState<SourceFilter>("openmeteo")
  const [model, setModel]     = useState<ModelType>("GFS")

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/wind-forecast")
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  // Scroll to current hour once data is ready
  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => {
        document.getElementById("forecast-current")
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 200)
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToNow = () =>
    document.getElementById("forecast-current")
      ?.scrollIntoView({ behavior: "smooth", block: "center" })

  const { todayKey, currentHour } = getMartiniqueState()

  const activeSource =
    source === "yr" ? data?.yr : data?.openMeteo?.[model]

  const forecasts = (activeSource?.forecasts ?? []).filter(f => {
    const h = new Date(f.time).getUTCHours()
    return h >= 7 && h <= 19
  })
  const srcLabel  = activeSource?.label ?? ""
  const dayGroups = groupByDay(forecasts)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Toggle vue + bouton Maintenant */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ViewToggle view={view} onChange={setView} />
        {view === "forecast" && (
          <button
            onClick={scrollToNow}
            style={{
              height: 42, padding: "0 14px", borderRadius: "var(--r-pill)",
              border: "1.5px solid var(--border)", background: "var(--card)",
              color: "var(--brand)", fontWeight: 600, fontSize: 13,
              cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            ⏱ Maintenant
          </button>
        )}
      </div>

      {/* Filtres */}
      <div>
        <FilterToggle
          source={source} model={model}
          onSourceChange={setSource} onModelChange={setModel}
          data={data}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--muted-text)", fontWeight: 500 }}>{srcLabel}</span>
          {data?.fetchedAt && (
            <span style={{ fontSize: 11, color: "var(--muted-text)" }}>
              Mis à jour {new Date(data.fetchedAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Contenu */}
      {loading && <SkeletonRows />}

      {!loading && error && (
        <div style={{
          padding: "32px 20px", textAlign: "center",
          background: "var(--card)", borderRadius: "var(--r-card)", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>⚠️</div>
          <p style={{ fontWeight: 600, color: "var(--danger)" }}>Données indisponibles</p>
          <p style={{ fontSize: 12, color: "var(--muted-text)", marginTop: 4 }}>{error}</p>
        </div>
      )}

      {!loading && !error && view === "forecast" && (
        dayGroups.length === 0 ? (
          <div style={{
            padding: "40px 20px", textAlign: "center",
            background: "var(--card)", borderRadius: "var(--r-card)", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: 32, opacity: 0.25, marginBottom: 8 }}>🌬️</div>
            <p style={{ color: "var(--muted-text)" }}>Aucune prévision disponible</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dayGroups.map(({ key, rows }) => (
              <DayCard
                key={key}
                dayKey={key}
                todayKey={todayKey}
                currentHour={currentHour}
                label={new Date(key + "T12:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
                rows={rows}
              />
            ))}
          </div>
        )
      )}

      {!loading && !error && view === "calendar" && (
        <WeekCalendar forecasts={forecasts} sourceLabel={srcLabel} />
      )}

      {data?.errors && Object.keys(data.errors).length > 0 && (
        <div style={{
          padding: "10px 14px", borderRadius: "var(--r-sm)",
          background: "var(--surface)", border: "1px solid var(--border-soft)",
        }}>
          {Object.entries(data.errors).map(([src, msg]) => (
            <p key={src} style={{ fontSize: 11, color: "var(--muted-text)", lineHeight: 1.7 }}>
              <span style={{ fontWeight: 600 }}>{src}</span> : {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
