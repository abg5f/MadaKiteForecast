"use client"

import { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react"
import FilterToggle, { type SourceFilter } from "./FilterToggle"
import WeekCalendar from "./WeekCalendar"
import type { AggregatedForecast, HourlyForecast, ModelType } from "@/lib/api-clients"
import { useSpot } from "./SpotProvider"

const POLL_INTERVAL = 15 * 60 * 1000

// Open-Meteo returns "America/Martinique" local times stored as UTC on the server (UTC+0).
// So getUTCHours() gives back the Martinique hour. Current MQ hour = UTC - 4.
function getMartiniqueState() {
  const now = new Date()
  const todayKey = now.toLocaleDateString("en-CA", { timeZone: "America/Martinique" })
  const currentHour = (now.getUTCHours() - 4 + 24) % 24
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowKey = tomorrow.toLocaleDateString("en-CA", { timeZone: "America/Martinique" })
  return { todayKey, tomorrowKey, currentHour, isEvening: currentHour >= 20 }
}

// ── Wind scale (knots) ────────────────────────────────────────────────────────

function windCond(kts: number) {
  if (kts < 11) return { label: "Calme",     bg: "var(--surface)",      color: "var(--muted-text)" }
  if (kts < 13) return { label: "★",         bg: "var(--info-soft)",    color: "var(--info)" }
  if (kts < 15) return { label: "★★",        bg: "var(--success-soft)", color: "var(--success)" }
  if (kts < 22) return { label: "★★★",       bg: "var(--success-soft)", color: "var(--success)" }
  if (kts < 30) return { label: "Fort",      bg: "var(--warning-soft)", color: "var(--warning)" }
  if (kts < 38) return { label: "Très fort", bg: "#ffedd5",             color: "#c2410c" }
  return              { label: "Danger",     bg: "var(--danger-soft)",  color: "var(--danger)" }
}

const DIR = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
const dirLabel = (deg: number) => DIR[Math.round(deg / 45) % 8]

// ── View toggle ───────────────────────────────────────────────────────────────

type AppView = "forecast" | "calendar" | "radar"

function ViewToggle({ view, onChange }: { view: AppView; onChange: (v: AppView) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const [g, setG] = useState({ left: 0, width: 0 })
  const opts: { value: AppView; label: string }[] = [
    { value: "forecast",  label: "Prévisions" },
    { value: "calendar",  label: "Calendrier" },
    { value: "radar",     label: "Radar" },
  ]
  const idx = opts.findIndex(o => o.value === view)

  useLayoutEffect(() => {
    const el = refs.current[idx]
    if (el) setG({ left: el.offsetLeft, width: el.offsetWidth })
  }, [idx])

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
  f, isPast, isNow, isScrollTarget,
}: {
  f: HourlyForecast; isPast?: boolean; isNow?: boolean; isScrollTarget?: boolean
}) {
  const cond = windCond(f.windSpeed)
  const h = new Date(f.time).getUTCHours()
  const hour = `${String(h).padStart(2, "0")}:00`

  return (
    <div
      id={isNow ? "forecast-current" : isScrollTarget ? "forecast-next-7" : undefined}
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

// ── Radar view (Windy embed) ──────────────────────────────────────────────────

const RADAR_LAYERS = [
  { id: "radar",     label: "🌧 Pluie",     title: "Radar précipitations" },
  { id: "wind",      label: "💨 Vent",      title: "Animation vent" },
  { id: "satellite", label: "🛰 Satellite", title: "Satellite IR" },
  { id: "swell",     label: "🌊 Houle",     title: "Hauteur des vagues" },
]

function RadarView() {
  const [layer, setLayer] = useState("radar")

  const src =
    `https://embed.windy.com/embed2.html` +
    `?lat=14.55&lon=-60.83&zoom=9` +
    `&level=surface&overlay=${layer}` +
    `&menu=&message=true&marker=true` +
    `&calendar=12&pressure=&type=map` +
    `&location=coordinates&detail=` +
    `&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Sélecteur de couche */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {RADAR_LAYERS.map(l => (
          <button
            key={l.id}
            onClick={() => setLayer(l.id)}
            style={{
              padding: "7px 14px", borderRadius: "var(--r-pill)",
              border: `1.5px solid ${layer === l.id ? "var(--brand)" : "var(--border)"}`,
              background: layer === l.id ? "var(--brand)" : "var(--card)",
              color: layer === l.id ? "#fff" : "var(--text-2)",
              fontSize: 13, fontWeight: layer === l.id ? 600 : 400,
              cursor: "pointer", transition: "all .15s",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Carte Windy */}
      <div style={{
        borderRadius: "var(--r-card)", overflow: "hidden",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-card)",
      }}>
        <div style={{
          padding: "8px 14px",
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
            {RADAR_LAYERS.find(l => l.id === layer)?.title} · Martinique
          </span>
          <span style={{ fontSize: 11, color: "var(--muted-text)" }}>Windy.com</span>
        </div>
        <iframe
          key={layer}
          src={src}
          width="100%"
          height="420"
          frameBorder="0"
          allow="fullscreen"
          title="Radar météo Martinique — Windy"
          style={{ display: "block" }}
        />
      </div>

      <p style={{ fontSize: 11, color: "var(--muted-text)", textAlign: "center" }}>
        Carte interactive · Pincer pour zoomer · Lecture animée disponible
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function DayCard({
  label, rows, dayKey, todayKey, tomorrowKey, currentHour, isEvening,
}: {
  label: string; rows: HourlyForecast[]
  dayKey: string; todayKey: string; tomorrowKey: string
  currentHour: number; isEvening: boolean
}) {
  const isToday    = dayKey === todayKey
  const isTomorrow = dayKey === tomorrowKey
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
            isScrollTarget={isEvening && isTomorrow && h === 7}
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
  const { spot } = useSpot()
  const [data, setData]       = useState<AggregatedForecast | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState<AppView>("forecast")
  const [source, setSource]   = useState<SourceFilter>("openmeteo")
  const [model, setModel]     = useState<ModelType>("AROME")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/wind-forecast?lat=${spot.lat}&lng=${spot.lng}`)
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [spot.lat, spot.lng])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  const { todayKey, tomorrowKey, currentHour, isEvening } = getMartiniqueState()

  // After 20:00 MQ, scroll to next day 07:00 instead of current hour
  const scrollTargetId = isEvening ? "forecast-next-7" : "forecast-current"

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => {
        document.getElementById(scrollTargetId)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 200)
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToNow = () =>
    document.getElementById(scrollTargetId)
      ?.scrollIntoView({ behavior: "smooth", block: "center" })

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

      {/* Toggle vue */}
      <div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Vue Radar — indépendante des filtres */}
      {view === "radar" && <RadarView />}

      {/* Filtres — masqués en vue radar */}
      {view !== "radar" && <div>
        <FilterToggle
          source={source} model={model}
          onSourceChange={setSource} onModelChange={setModel}
          data={data}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--muted-text)", fontWeight: 500 }}>{srcLabel}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {view === "forecast" && (
              <button
                onClick={scrollToNow}
                style={{
                  height: 28, padding: "0 10px", borderRadius: "var(--r-pill)",
                  border: "1.5px solid var(--border)", background: "var(--card)",
                  color: "var(--brand)", fontWeight: 600, fontSize: 11,
                  cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                }}
              >
                ⏱ Maintenant
              </button>
            )}
            {data?.fetchedAt && (
              <span style={{ fontSize: 11, color: "var(--muted-text)" }}>
                Mis à jour {new Date(data.fetchedAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>}

      {/* Contenu prévisions/calendrier */}
      {view !== "radar" && loading && <SkeletonRows />}

      {view !== "radar" && !loading && error && (
        <div style={{
          padding: "32px 20px", textAlign: "center",
          background: "var(--card)", borderRadius: "var(--r-card)", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>⚠️</div>
          <p style={{ fontWeight: 600, color: "var(--danger)" }}>Données indisponibles</p>
          <p style={{ fontSize: 12, color: "var(--muted-text)", marginTop: 4 }}>{error}</p>
        </div>
      )}

      {view !== "radar" && !loading && !error && view === "forecast" && (
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
            {dayGroups.filter(({ key }) => !(isEvening && key === todayKey)).map(({ key, rows }) => (
              <DayCard
                key={key}
                dayKey={key}
                todayKey={todayKey}
                tomorrowKey={tomorrowKey}
                currentHour={currentHour}
                isEvening={isEvening}
                label={new Date(key + "T12:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                })}
                rows={rows}
              />
            ))}
          </div>
        )
      )}

      {view !== "radar" && !loading && !error && view === "calendar" && (
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
