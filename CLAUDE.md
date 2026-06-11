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

The app is a single-page wind forecast aggregator for the Pointe Faula kitesurf spot in Martinique. There is no database — all data is fetched live from two external APIs.

### Data flow

```
Browser (30 min poll)
  -> GET /api/wind-forecast          (src/app/api/wind-forecast/route.ts)
      -> fetchWindy() + fetchWindguru() in parallel
      -> computeAverage()
      -> returns { windy, windguru, average, fetchedAt }
  -> WindForecast component renders one of the three datasets
     depending on the FilterToggle selection
```

### Key files

| File | Role |
|------|------|
| `src/lib/api-clients.ts` | All external API logic: Windy HTTP POST, Windguru JSON GET, angle-correct average |
| `src/app/api/wind-forecast/route.ts` | Next.js route handler — calls both APIs via Promise.allSettled (graceful degradation if one fails) |
| `src/components/WindForecast.tsx` | Main UI component: fetches, polls, renders forecast rows |
| `src/components/FilterToggle.tsx` | Tabs (Moyenne / Windy / Windguru) |

### Environment variables (.env.local)

```
WINDY_API_KEY=        # from api.windy.com
WINDGURU_API_KEY=     # from windguru.cz/api
WINDGURU_SPOT_ID=64   # Pointe Faula spot ID
SPOT_LAT=14.55        # override lat (optional)
SPOT_LNG=-60.83       # override lng (optional)
```

### Wind data contract (HourlyForecast)

All speeds are in **km/h**, direction in **degrees 0-360**. Windy returns m/s (x3.6 conversion) and u/v components (atan2 for direction). Windguru also returns m/s. The average uses unit-vector circular mean for direction to avoid the 359/1 deg discontinuity.

### Caching

The API route sets `Cache-Control: public, s-maxage=1800` so Vercel/CDN can cache. The client polls every 30 minutes via setInterval. Next.js fetch calls inside the route use `next: { revalidate: 1800 }`.
