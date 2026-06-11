"use client"

import { useEffect, useState, useCallback } from "react"
import FilterToggle, { type SourceFilter } from "./FilterToggle"
import type { AggregatedForecast, HourlyForecast, ModelType } from "@/lib/api-clients"

const POLL_INTERVAL = 30 * 60 * 1000

// Kite-specific wind scale in knots
function windCondition(kts: number): { label: string; bg: string; color: string } {
  if (kts < 8)  return { label: "Calme",    bg: "#e0f0ff", color: "#4a7fa8" }
  if (kts < 14) return { label: "Léger",    bg: "#dbeafe", color: "#1d6fa5" }
  if (kts < 22) return { label: "Idéal ✓",  bg: "#d1fae5", color: "#065f46" }
  if (kts < 30) return { label: "Fort",     bg: "#fef3c7", color: "#92400e" }
  if (kts < 38) return { label: "Très fort",bg: "#ffedd5", color: "#9a3412" }
  return              { label: "Danger",   bg: "#fee2e2", color: "#b91c1c" }
}

function dirLabel(deg: number): string {
  return ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(deg / 45) % 8]
}

function Skeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 52,
            borderRadius: "var(--r-card)",
            background: "var(--surface)",
            animation: "pulse 1.5s ease-in-out infinite",
            opacity: 0.7 - i * 0.05,
          }}
        />
      ))}
    </div>
  )
}

function ForecastRow({ f, index }: { f: HourlyForecast; index: number }) {
  const cond = windCondition(f.windSpeed)
  const date = new Date(f.time)
  const isNewDay = index === 0 || new Date(f.time).getDate() !== new Date(
    new Date(f.time).getTime() - 3600_000
  ).getDate()
  const day  = date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
  const hour = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  return (
    <>
      {isNewDay && index > 0 && (
        <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: "var(--r-card)",
          background: "var(--card)",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Date/heure */}
        <div style={{ width: 60, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{day}</div>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>{hour}</div>
        </div>

        {/* Direction */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 16,
              lineHeight: 1,
              color: "var(--brand)",
              transform: `rotate(${f.windDir}deg)`,
              transition: "transform 0.3s",
            }}
            title={`${f.windDir}°`}
          >
            ↑
          </span>
          <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2, fontWeight: 600 }}>
            {dirLabel(f.windDir)}
          </span>
        </div>

        {/* Vitesse */}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "var(--foreground)", lineHeight: 1 }}>
            {f.windSpeed}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: 3 }}>kts</span>
          {f.windGust > f.windSpeed + 2 && (
            <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted-foreground)" }}>
              rafales{" "}
              <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{f.windGust}</span>
            </span>
          )}
        </div>

        {/* Badge condition */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "var(--r-pill)",
            background: cond.bg,
            color: cond.color,
            flexShrink: 0,
          }}
        >
          {cond.label}
        </span>
      </div>
    </>
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
    source === "average"    ? data?.average :
    source === "stormglass" ? data?.stormglass :
    source === "yr"         ? data?.yr :
                              data?.openMeteo?.[model]

  const forecasts   = activeSource?.forecasts?.slice(0, 48) ?? []
  const sourceLabel = activeSource?.label ?? ""

  return (
    <div>
      {/* Filtres */}
      <FilterToggle
        source={source}
        model={model}
        onSourceChange={setSource}
        onModelChange={setModel}
        data={data}
      />

      {/* Label source + heure */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 12px" }}>
        <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500 }}>
          {sourceLabel}
        </span>
        {data?.fetchedAt && (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            Mis à jour {new Date(data.fetchedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* États */}
      {loading && <Skeleton />}

      {!loading && error && (
        <div style={{
          textAlign: "center", padding: "40px 16px",
          background: "var(--card)", borderRadius: "var(--r-card)",
          border: "1px solid var(--border)",
        }}>
          <p style={{ fontWeight: 600, color: "var(--destructive)" }}>Données indisponibles</p>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>{error}</p>
        </div>
      )}

      {!loading && !error && forecasts.length === 0 && (
        <div style={{
          textAlign: "center", padding: "40px 16px",
          background: "var(--card)", borderRadius: "var(--r-card)",
          border: "1px solid var(--border)",
        }}>
          <p style={{ fontSize: 32, opacity: 0.3 }}>🌬️</p>
          <p style={{ color: "var(--muted-foreground)", marginTop: 8 }}>Aucune prévision disponible</p>
        </div>
      )}

      {!loading && forecasts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {forecasts.map((f, i) => (
            <ForecastRow key={f.time} f={f} index={i} />
          ))}
        </div>
      )}

      {/* Erreurs partielles */}
      {data?.errors && Object.keys(data.errors).length > 0 && (
        <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: "var(--r-card)", background: "var(--surface)" }}>
          {Object.entries(data.errors).map(([src, msg]) => (
            <p key={src} style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600 }}>{src}</span> indisponible : {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
