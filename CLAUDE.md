# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check without emitting
```

## Architecture

**Stack:** Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui

The app is a single-page wind forecast aggregator for the Pointe Faula kitesurf spot in Martinique. There is no database — all data is fetched live from three external APIs.

### Data flow

```
Browser (30 min poll)
  -> GET /api/wind-forecast          (src/app/api/wind-forecast/route.ts)
      -> fetchOpenMeteo(GFS|ICON|ERA5|AROME) x4 in parallel
      -> fetchStormglass()  (in-memory 6h cache — free tier = 10 req/day)
      -> fetchYr()
      -> computeAverage([all sources])
      -> returns AggregatedForecast
  -> WindForecast component renders based on (source, model) filter state
```

### Key files

| File | Role |
|------|------|
| `src/lib/api-clients.ts` | All external API logic + types + computeAverage |
| `src/app/api/wind-forecast/route.ts` | Route handler — Promise.allSettled over 6 fetches |
| `src/components/WindForecast.tsx` | Main UI: fetch, poll, render |
| `src/components/FilterToggle.tsx` | Two-level filter: Source tabs then Model sub-tabs |

### Filter state

Two independent state values in `WindForecast`:
- `source: SourceFilter` — `"average" | "openmeteo" | "stormglass" | "yr"`
- `model: ModelType` — `"GFS" | "ICON" | "ERA5" | "AROME"` (active only when source = openmeteo)

### Environment variables (.env.local)

```
STORMGLASS_API_KEY=   # from stormglass.io — 10 req/day free, server-cached 6h
SPOT_LAT=14.55        # override lat (optional)
SPOT_LNG=-60.83       # override lng (optional)
```

Open-Meteo and Yr.no require no API key.

### Wind data contract (HourlyForecast)

All speeds in **km/h**, direction in **degrees 0-360**. Open-Meteo returns km/h directly (windspeed_unit=kmh). Stormglass and Yr.no return m/s (x3.6 conversion). `computeAverage` uses unit-vector circular mean for direction to avoid the 359/1 deg discontinuity.

### Open-Meteo model mapping

| UI label | Open-Meteo model ID         |
|----------|-----------------------------|
| GFS      | `gfs_seamless`              |
| ICON     | `icon_seamless`             |
| ERA5     | `era5` (historical reanalysis — past data only, may return fewer rows) |
| AROME    | `meteofrance_arpege_world`  |

### Stormglass caching

The free tier allows 10 requests/day. `fetchStormglass()` keeps a module-level in-memory cache with 6h TTL (max 4 calls/day). On Vercel cold starts the cache is lost, so actual usage may be slightly higher.

### Caching

API route: `Cache-Control: public, s-maxage=1800`. Open-Meteo and Yr.no fetches: `next: { revalidate: 1800 }`. Client polls every 30 minutes.
