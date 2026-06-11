import { NextResponse } from "next/server"
import { fetchWindy, fetchWindguru, computeAverage, AggregatedForecast } from "@/lib/api-clients"

export const dynamic = "force-dynamic"

export async function GET() {
  const [windyResult, windguruResult] = await Promise.allSettled([
    fetchWindy(),
    fetchWindguru(),
  ])

  const windy = windyResult.status === "fulfilled" ? windyResult.value : null
  const windguru = windguruResult.status === "fulfilled" ? windguruResult.value : null
  const windyError = windyResult.status === "rejected" ? (windyResult.reason as Error).message : null
  const windguruError = windguruResult.status === "rejected" ? (windguruResult.reason as Error).message : null

  if (!windy && !windguru) {
    return NextResponse.json(
      { error: "Both sources unavailable", windyError, windguruError },
      { status: 503 }
    )
  }

  const average = computeAverage(windy, windguru)

  const payload: AggregatedForecast & { errors?: Record<string, string> } = {
    windy,
    windguru,
    average,
    fetchedAt: new Date().toISOString(),
    ...(windyError || windguruError
      ? { errors: { ...(windyError && { windy: windyError }), ...(windguruError && { windguru: windguruError }) } }
      : {}),
  }

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300" },
  })
}
