"use client"

import { useEffect, useRef, useState } from "react"

type StationData = {
  windAvg:     number | null
  windGust:    number | null
  windLull:    number | null
  windDir:     number | null
  temperature: number | null
  humidity:    number | null
  battery:     number | null
  timestamp:   number
  deviceId:    number
}

const POLL_MS = 2 * 60 * 1000

const DIR_LABELS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO"]

function dirLabel(deg: number) {
  return DIR_LABELS[Math.round(deg / 22.5) % 16]
}

function windStars(kts: number) {
  if (kts < 11) return { label: "Calme",  color: "#a8a098" }
  if (kts < 13) return { label: "★",      color: "#f59e0b" }
  if (kts < 15) return { label: "★★",     color: "#f97316" }
  if (kts < 22) return { label: "★★★",    color: "#22c55e" }
  if (kts < 30) return { label: "Fort",   color: "#ef4444" }
  return             { label: "Danger", color: "#dc2626" }
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("fr-FR", {
    timeZone: "America/Martinique", hour: "2-digit", minute: "2-digit",
  })
}

function Compass({ deg }: { deg: number }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="19" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      {[0,90,180,270].map(a => {
        const r = (a * Math.PI) / 180
        const x1 = 20 + 15*Math.sin(r), y1 = 20 - 15*Math.cos(r)
        const x2 = 20 + 18*Math.sin(r), y2 = 20 - 18*Math.cos(r)
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
      })}
      <g transform={`rotate(${deg}, 20, 20)`}>
        <polygon points="20,5 22.5,20 20,17 17.5,20" fill="white" opacity="0.95"/>
        <polygon points="20,35 22.5,20 20,23 17.5,20" fill="rgba(255,255,255,0.35)"/>
      </g>
    </svg>
  )
}

export default function CapEstStation() {
  const [data,    setData]    = useState<StationData | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    try {
      const res = await fetch("/api/capest-station")
      if (!res.ok) {
        setError("api")
        return
      }
      const j: StationData = await res.json()
      setData(j)
      setError(null)
    } catch {
      setError("api")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, POLL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  if (loading) {
    return (
      <div style={{ padding: "14px 12px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>Chargement…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: "14px 12px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>Station indisponible</p>
      </div>
    )
  }

  const windOk = data.windAvg !== null

  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

        {/* Compas — grisé si pas de vent */}
        <div style={{ opacity: windOk ? 1 : 0.3 }}>
          <Compass deg={data.windDir ?? 0} />
        </div>

        <div style={{ flex: 1 }}>
          {windOk ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {data.windAvg}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>kts</span>
                <span style={{
                  marginLeft: 4, fontSize: 12, fontWeight: 700,
                  color: windStars(data.windAvg!).color,
                  padding: "2px 7px", borderRadius: 99,
                  background: "rgba(255,255,255,0.1)",
                }}>
                  {windStars(data.windAvg!).label}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 4 }}>
                {data.windLull !== null && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                    Lull <strong style={{ color: "rgba(255,255,255,0.85)" }}>{data.windLull}</strong>
                  </span>
                )}
                {data.windGust !== null && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                    Rafale <strong style={{ color: "rgba(255,255,255,0.85)" }}>{data.windGust} kts</strong>
                  </span>
                )}
                {data.windDir !== null && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                    {dirLabel(data.windDir)} {data.windDir}°
                  </span>
                )}
              </div>
            </>
          ) : (
            <div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 2px", fontWeight: 600 }}>
                Anémomètre hors ligne
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Données vent indisponibles
              </p>
            </div>
          )}
        </div>

        {/* Temp / humidité */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {data.temperature !== null && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
              {Math.round(data.temperature)}°C
            </span>
          )}
          {data.humidity !== null && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              💧 {Math.round(data.humidity)}%
            </span>
          )}
          {data.battery !== null && data.battery < 2.2 && (
            <span style={{ fontSize: 10, color: "#f59e0b" }}>🔋 {data.battery.toFixed(2)}V</span>
          )}
        </div>
      </div>

      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "8px 0 0", letterSpacing: "0.02em" }}>
        CKS Martinique · Mise à jour {formatTime(data.timestamp)}
      </p>
    </div>
  )
}
