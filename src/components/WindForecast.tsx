"use client"

import { useEffect, useState, useCallback } from "react"
import FilterToggle, { type SourceFilter } from "./FilterToggle"
import type { AggregatedForecast, HourlyForecast, ModelType } from "@/lib/api-clients"

const POLL_INTERVAL = 30 * 60 * 1000

// Kite wind scale in knots
function windCond(kts: number) {
  if (kts < 8)  return { label: "Calme",     bg: "var(--surface)",     color: "var(--muted-text)" }
  if (kts < 14) return { label: "Léger",     bg: "var(--info-soft)",   color: "var(--info)" }
  if (kts < 22) return { label: "Idéal",     bg: "var(--success-soft)",color: "var(--success)" }
  if (kts < 30) return { label: "Fort",      bg: "var(--warning-soft)",color: "var(--warning)" }
  if (kts < 38) return { label: "Très fort", bg: "#ffedd5",            color: "#c2410c" }
  return              { label: "Danger",    bg: "var(--danger-soft)",  color: "var(--danger)" }
}

const DIR_LABELS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
function dirLabel(deg: number) { return DIR_LABELS[Math.round(deg / 45) % 8] }

// Group forecasts by calendar day
function groupByDay(forecasts: HourlyForecast[]): { dateKey: string; label: string; rows: HourlyForecast[] }[] {
  const map = new Map<string, HourlyForecast[]>()
  for (const f of forecasts) {
    const d = new Date(f.time)
    const key = d.toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  return Array.from(map.entries()).map(([key, rows]) => ({
    dateKey: key,
    label: new Date(key + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
    rows,
  }))
}

function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          height: 52, borderRadius: "var(--r-card)",
          background: "var(--surface)",
          opacity: 1 - i * 0.12,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  )
}

function ForecastRow({ f }: { f: HourlyForecast }) {
  const cond = windCond(f.windSpeed)
  const d = new Date(f.time)
  const hour = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const hasGust = f.windGust > f.windSpeed + 2

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px",
      borderBottom: "1px solid var(--border-soft)",
    }}>
      {/* Heure */}
      <span style={{
        width: 44, flexShrink: 0,
        fontSize: 13, fontWeight: 500, color: "var(--text-2)",
      }}>
        {hour}
      </span>

      {/* Direction */}
      <div style={{ width: 36, flexShrink: 0, textAlign: "center" }}>
        <div style={{
          fontSize: 15, lineHeight: 1, color: "var(--brand)",
          display: "inline-block",
          transform: `rotate(${f.windDir}deg)`,
          transition: "transform 0.3s ease",
        }}>↑</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-text)", letterSpacing: "0.04em", marginTop: 1 }}>
          {dirLabel(f.windDir)}
        </div>
      </div>

      {/* Vitesse */}
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: "var(--text)" }}>
          {f.windSpeed}
        </span>
        <span style={{ fontSize: 11, color: "var(--muted-text)" }}>kts</span>
        {hasGust && (
          <span style={{ fontSize: 12, color: "var(--label)", marginLeft: 4 }}>
            rafales <strong style={{ color: "var(--text-2)" }}>{f.windGust}</strong>
          </span>
        )}
      </div>

      {/* Badge */}
      <span style={{
        fontSize: 11, fontWeight: 700,
        padding: "3px 10px",
        borderRadius: "var(--r-pill)",
        background: cond.bg, color: cond.color,
        flexShrink: 0,
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
      {/* En-tête du jour */}
      <div style={{
        padding: "8px 14px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.06em",
          color: "var(--label)",
        }}>
          {label}
        </span>
      </div>

      {/* Lignes */}
      <div>
        {rows.map((f) => <ForecastRow key={f.time} f={f} />)}
      </div>
    </div>
  )
}

export default function WindForecast() {
  const [data, setData]       = useState<AggregatedForecast | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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

  const groups = groupByDay(activeSource?.forecasts?.slice(0, 48) ?? [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Filtres */}
      <div>
        <FilterToggle
          source={source} model={model}
          onSourceChange={setSource} onModelChange={setModel}
          data={data}
        />
        {/* Meta : source + heure */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--muted-text)", fontWeight: 500 }}>
            {activeSource?.label ?? ""}
          </span>
          {data?.fetchedAt && (
            <span style={{ fontSize: 11, color: "var(--muted-text)" }}>
              Mis à jour {new Date(data.fetchedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* États */}
      {loading && <SkeletonRows />}

      {!loading && error && (
        <div style={{
          padding: "32px 20px", textAlign: "center",
          background: "var(--card)", borderRadius: "var(--r-card)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>⚠️</div>
          <p style={{ fontWeight: 600, color: "var(--danger)" }}>Données indisponibles</p>
          <p style={{ fontSize: 12, color: "var(--muted-text)", marginTop: 4 }}>{error}</p>
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div style={{
          padding: "40px 20px", textAlign: "center",
          background: "var(--card)", borderRadius: "var(--r-card)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 32, opacity: 0.25, marginBottom: 8 }}>🌬️</div>
          <p style={{ color: "var(--muted-text)" }}>Aucune prévision disponible</p>
        </div>
      )}

      {/* Prévisions groupées par jour */}
      {!loading && groups.length > 0 && groups.map((g) => (
        <DayCard key={g.dateKey} label={g.label} rows={g.rows} />
      ))}

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
