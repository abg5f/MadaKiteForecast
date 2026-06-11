import { NextResponse } from "next/server"
import {
  fetchOpenMeteo,
  fetchYr,
  computeAverage,
  type ModelType,
  type AggregatedForecast,
} from "@/lib/api-clients"

export const dynamic = "force-dynamic"

const MODELS: ModelType[] = ["GFS", "ICON", "ERA5", "AROME"]

export async function GET() {
  const [gfsR, iconR, era5R, aromeR, yrR] = await Promise.allSettled([
    fetchOpenMeteo("GFS"),
    fetchOpenMeteo("ICON"),
    fetchOpenMeteo("ERA5"),
    fetchOpenMeteo("AROME"),
    fetchYr(),
  ])

  const results = [gfsR, iconR, era5R, aromeR]
  const openMeteo = Object.fromEntries(
    MODELS.map((m, i) => [
      m,
      results[i].status === "fulfilled" ? results[i].value : null,
    ])
  ) as AggregatedForecast["openMeteo"]

  const yr = yrR.status === "fulfilled" ? yrR.value : null

  const allSources = [...Object.values(openMeteo).filter(Boolean), yr]

  if (allSources.length === 0) {
    return NextResponse.json({ error: "All sources unavailable" }, { status: 503 })
  }

  const average = computeAverage(allSources)

  const errors: Record<string, string> = {}
  if (gfsR.status   === "rejected") errors["GFS"]   = (gfsR.reason   as Error).message
  if (iconR.status  === "rejected") errors["ICON"]  = (iconR.reason  as Error).message
  if (era5R.status  === "rejected") errors["ERA5"]  = (era5R.reason  as Error).message
  if (aromeR.status === "rejected") errors["AROME"] = (aromeR.reason as Error).message
  if (yrR.status    === "rejected") errors["Yr.no"] = (yrR.reason    as Error).message

  const payload: AggregatedForecast = {
    openMeteo,
    yr,
    average,
    fetchedAt: new Date().toISOString(),
    ...(Object.keys(errors).length > 0 && { errors }),
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300" },
  })
}
