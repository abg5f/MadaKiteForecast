"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import FilterToggle, { type SourceFilter } from "./FilterToggle"
import type { AggregatedForecast, HourlyForecast, ModelType } from "@/lib/api-clients"

const POLL_INTERVAL = 30 * 60 * 1000

function windCondition(speed: number): { label: string; color: string } {
  if (speed < 15) return { label: "Léger",     color: "bg-blue-100 text-blue-800" }
  if (speed < 25) return { label: "Modéré",    color: "bg-green-100 text-green-800" }
  if (speed < 35) return { label: "Bon",       color: "bg-yellow-100 text-yellow-800" }
  if (speed < 45) return { label: "Fort",      color: "bg-orange-100 text-orange-800" }
  return              { label: "Très fort", color: "bg-red-100 text-red-800" }
}

function dirLabel(deg: number): string {
  return ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(deg / 45) % 8]
}

function WindArrow({ deg }: { deg: number }) {
  return (
    <span
      className="inline-block text-base leading-none select-none"
      style={{ transform: `rotate(${deg}deg)` }}
      title={`${deg}°`}
    >
      ↑
    </span>
  )
}

function ForecastRow({ f }: { f: HourlyForecast }) {
  const cond = windCondition(f.windSpeed)
  const date = new Date(f.time)
  const day  = date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
  const hour = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <div className="w-28 shrink-0 text-sm">
        <div className="font-medium">{day}</div>
        <div className="text-muted-foreground">{hour}</div>
      </div>
      <WindArrow deg={f.windDir} />
      <span className="text-xs text-muted-foreground w-8">{dirLabel(f.windDir)}</span>
      <div className="flex-1">
        <span className="text-lg font-bold">{f.windSpeed}</span>
        <span className="text-xs text-muted-foreground ml-1">km/h</span>
        {f.windGust > f.windSpeed + 2 && (
          <span className="ml-2 text-sm text-muted-foreground">
            rafales <span className="font-semibold text-foreground">{f.windGust}</span>
          </span>
        )}
      </div>
      <Badge className={cond.color + " border-0 shrink-0"}>{cond.label}</Badge>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
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

  // Resolve the active dataset from filter state
  const activeSource =
    source === "average"    ? data?.average :
    source === "stormglass" ? data?.stormglass :
    source === "yr"         ? data?.yr :
                              data?.openMeteo?.[model]

  const forecasts  = activeSource?.forecasts?.slice(0, 48) ?? []
  const sourceLabel = activeSource?.label ?? ""

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">Pointe Faula · Le Vauclin</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Martinique — prévisions de vent</p>
          </div>
          {data?.fetchedAt && (
            <p className="text-xs text-muted-foreground shrink-0 pt-1">
              {new Date(data.fetchedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        <div className="mt-3">
          <FilterToggle
            source={source}
            model={model}
            onSourceChange={setSource}
            onModelChange={setModel}
            data={data}
          />
        </div>

        {sourceLabel && (
          <p className="text-xs text-muted-foreground mt-1 text-right">{sourceLabel}</p>
        )}
      </CardHeader>

      <CardContent>
        {loading && <LoadingRows />}

        {!loading && error && (
          <div className="text-center py-8 text-destructive">
            <p className="font-medium">Données indisponibles</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && forecasts.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            Aucune prévision disponible pour cette source.
          </p>
        )}

        {!loading && forecasts.length > 0 && (
          <div>
            {forecasts.map((f) => (
              <ForecastRow key={f.time} f={f} />
            ))}
          </div>
        )}

        {data?.errors && Object.keys(data.errors).length > 0 && (
          <div className="mt-4 pt-3 border-t space-y-1">
            {Object.entries(data.errors).map(([src, msg]) => (
              <p key={src} className="text-xs text-muted-foreground">
                <span className="font-medium">{src}</span> indisponible : {msg}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
