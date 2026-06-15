import { NextResponse } from "next/server"
import {
  fetchOpenMeteo,
  fetchWeatherFlow,
  computeAverage,
  type ModelType,
  type AggregatedForecast,
} from "@/lib/api-clients"

export const dynamic = "force-dynamic"

const MODELS: ModelType[] = ["GFS", "ICON", "ERA5", "AROME"]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get("lat") ?? "14.55")
  const lng = parseFloat(searchParams.get("lng") ?? "-60.83")

  const [gfsR, iconR, era5R, aromeR, wfR] = await Promise.allSettled([
    fetchOpenMeteo("GFS",   lat, lng),
    fetchOpenMeteo("ICON",  lat, lng),
    fetchOpenMeteo("ERA5",  lat, lng),
    fetchOpenMeteo("AROME", lat, lng),
    fetchWeatherFlow(),
  ])

  const results = [gfsR, iconR, era5R, aromeR]
  const openMeteo = Object.fromEntries(
    MODELS.map((m, i) => [
      m,
      results[i].status === "fulfilled" ? results[i].value : null,
    ])
  ) as AggregatedForecast["openMeteo"]

  openMeteo["WEATHERFLOW"] = wfR.status === "fulfilled" ? wfR.value : null

  const allSources = Object.values(openMeteo).filter(Boolean)

  if (allSources.length === 0) {
    return NextResponse.json({ error: "All sources unavailable" }, { status: 503 })
  }

  const average = computeAverage(allSources)

  const errors: Record<string, string> = {}
  if (gfsR.status   === "rejected") errors["GFS"]         = (gfsR.reason   as Error).message
  if (iconR.status  === "rejected") errors["ICON"]        = (iconR.reason  as Error).message
  if (era5R.status  === "rejected") errors["ERA5"]        = (era5R.reason  as Error).message
  if (aromeR.status === "rejected") errors["AROME"]       = (aromeR.reason as Error).message
  if (wfR.status    === "rejected") errors["WEATHERFLOW"] = (wfR.reason    as Error).message

  const payload: AggregatedForecast = {
    openMeteo,
    yr: null,
    average,
    fetchedAt: new Date().toISOString(),
    ...(Object.keys(errors).length > 0 && { errors }),
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  })
}
