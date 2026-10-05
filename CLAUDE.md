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

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 (no component library)

Kite wind forecast for Pointe Faula, Cap Est and Cap Chevalier (Martinique). No database: data is fetched live and cached by Next's fetch cache.

### Data flow

```
Browser
  -> GET /api/forecast?spot=faula   (15 min poll)  -> buildForecast()  src/lib/wind/forecast.ts
       1. Open-Meteo, ONE request for 7 models (past_days=2, forecast_days=7, knots, unix time)
       2. Station history (Windguru #4164, last 50 h) for calibration
       3. Per model: additive speed bias + gust factor vs station (kite hours 7-18 only),
          skill weight = prior / (MAE^2 + 0.5)
       4. Per hour: calibrated weighted mean (speed, gust), circular mean (dir), weighted std (spread)
  -> GET /api/station?spot=faula    (2 min poll)   -> fetchStation()   src/lib/wind/stations.ts
       Windguru JSON (iapi.php, needs Referer) or WeatherFlow Tempest (CKS_TOKEN)
```

### Key files

| File | Role |
|------|------|
| `src/lib/spots.ts` | Spots, offshore sectors, station config |
| `src/lib/wind/models.ts` | Model registry (Open-Meteo ids, prior weights) |
| `src/lib/wind/forecast.ts` | Calibration + consensus engine |
| `src/lib/wind/stations.ts` | Live station clients |
| `src/lib/wind/days.ts` | Day summary: kite window, stars, confidence, storm/offshore |
| `src/lib/wind/scale.ts` | Wind colour scale (OKLCH), kiteability, kite size, direction labels |
| `src/components/ForecastApp.tsx` | Client root: spot switch, polling, views |
| `src/components/ModelTable.tsx` | Windguru-style table, models stacked under the consensus |
| `src/components/DayDetail.tsx` / `HourGrid.tsx` / `WindChart.tsx` | "Synthèse" view of one day |

### Models (Open-Meteo)

ECMWF IFS (`ecmwf_ifs`), ECMWF AIFS (`ecmwf_aifs025_single`, no gusts), ARPEGE (`meteofrance_seamless`, ~4 days), ICON (`icon_seamless`), UKMO (`ukmo_global_deterministic_10km`), GFS (`gfs_seamless`), GEM (`gem_global`).
AROME does not cover Martinique on Open-Meteo; ERA5 is a reanalysis (no forecast) and was removed.

### Units and time

Speeds in **knots**, direction in degrees ("from"), times in **unix seconds UTC**. Martinique is UTC-4 with no DST: use helpers in `src/lib/time.ts`.

### Environment variables (.env.local / Vercel)

```
CKS_TOKEN=        # WeatherFlow token for the Cap Est Tempest station (optional)
```
