"use client"

import { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react"
import FilterToggle, { type SourceFilter } from "./FilterToggle"
import WeekCalendar from "./WeekCalendar"
import type { AggregatedForecast, HourlyForecast, ModelType } from "@/lib/api-clients"

const POLL_INTERVAL = 30 * 60 * 1000

// ── Wind scale (knots, kite-specific) ────────────────────────────────────────

function windCond(kts: number) {
  if (kts < 8)  return { label: "Calme",     bg: "var(--surface)",      color: "var(--muted-text)" }
  if (kts < 14) return { label: "Léger",     bg: "var(--info-soft)",    color: "var(--info)" }
  if (kts < 22) return { label: "Idéal",     bg: "var(--success-soft)", color: "var(--success)" }
  if (kts < 30) return { label: "Fort",      bg: "var(--warning-soft)", color: "var(--warning)" }
  if (kts < 38) return { label: "Très fort", bg: "#ffedd5",             color: "#c2410c" }
  return              { label: "Danger",    bg: "var(--danger-soft)",   color: "var(--danger)" }
}

const DIR = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
const dirLabel = (deg: number) => DIR[Math.round(deg / 45) % 8]

// ── View toggle (pilule glissière 2 options) ──────────────────────────────────

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
      position: "relative", display: "flex",
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

// ── Forecast list ─────────────────────────────────────────────────────────────

function groupByDay(forecasts: HourlyForecast[]) {
  const map = new Map<string, HourlyForecast[]>()
  for (const f of forecasts) {
    const key = new Date(f.time).toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }))
}

function ForecastRow({ f }: { f: HourlyForecast }) {
  const cond = windCond(f.windSpeed)
  const d = new Date(f.time)
  const hour = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px",
      borderBottom: "1px solid var(--border-soft)",
    }}>
      <span style={{ width: 44, flexShrink: 0, fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
        {hour}
      </span>

      <div style={{ width: 36, flexShrink: 0, textAlign: "center" }}>
        <div style={{
          fontSize: 14, lineHeight: 1, color: "var(--brand)",
          display: "inline-block",
          transform: `rotate(${f.windDir}deg)`,
        }}>↑</div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "var(--muted-text)", marginTop: 1 }}>
          {dirLabel(f.windDir)}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: "var(--text)" }}>
          {f.windSpeed}
        </span>
        <span style={{ fontSize: 11, color: "var(--muted-text)" }}>kts</span>
        {f.windGust > f.windSpeed + 2 && (
          <span style={{ fontSize: 12, color: "var(--label)", marginLeft: 4 }}>
            rafales <strong style={{ color: "var(--text-2)", fontWeight: 600 }}>{f.windGust}</strong>
          </span>
        )}
      </div>

      <span style={{
        fontSize: 11, fontWeight: 700,
        padding: "3px 10px", borderRadius: "var(--r-pill)",
        background: cond.bg, color: cond.color, flexShrink: 0,
      }}>
        {cond.label}
      </span>
    </div>
  )
}

function DayCard({ label, rows }: { label: string; rows: HourlyForecast[] }) {
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
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "var(--label)",
        }}>
          {label}
        </span>
      </div>
      {rows.map(f => <ForecastRow key={f.time} f={f} />)}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function WindForecast() {
  const [data, setData]       = useState<AggregatedForecast | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState<AppView>("forecast")
  const [source, setSource]   = useState<SourceFilter>("average")
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

  const activeSource =
    source === "average" ? data?.average :
    source === "yr"      ? data?.yr :
                           data?.openMeteo?.[model]

  const forecasts = (activeSource?.forecasts ?? []).filter(f => {
    const h = new Date(f.time).getHours()
    return h >= 7 && h <= 19
  })
  const srcLabel   = activeSource?.label ?? ""
  const dayGroups  = groupByDay(forecasts)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Vue toggle */}
      <ViewToggle view={view} onChange={setView} />

      {/* Filtres source/modèle */}
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
              Mis à jour {new Date(data.fetchedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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

      {/* Erreurs partielles */}
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
