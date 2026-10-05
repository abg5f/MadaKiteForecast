"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getSpot, REFERENCE_SPOT, SPOTS, type SpotId } from "@/lib/spots"
import { usePref } from "@/lib/prefs"
import { fmtClock, localDate, localHour, nowSec } from "@/lib/time"
import { summarizeDays } from "@/lib/wind/days"
import type { ForecastResponse, StationResponse } from "@/lib/wind/types"
import DayDetail from "./DayDetail"
import DayStrip from "./DayStrip"
import { Icon, KiteMark } from "./icons"
import LiveStation from "./LiveStation"
import ModelTable from "./ModelTable"
import RadarMap from "./RadarMap"

const FORECAST_POLL = 15 * 60_000
const STATION_POLL = 2 * 60_000
type View = "synthese" | "modeles"

type Remote<T> = { data: T | null; loading: boolean; failed: boolean }
type Entry<T> = { url: string; data: T | null; failed: boolean }

function useRemote<T>(url: string | null, every: number): Remote<T> & { reload: () => void } {
  const [entry, setEntry] = useState<Entry<T> | null>(null)
  const load = useCallback(() => {
    if (!url) return
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json() as Promise<T>
      })
      .then(
        (data) => setEntry({ url, data, failed: false }),
        // Keep the last good data on screen; flag the failure.
        () => setEntry((e) => ({ url, data: e?.url === url ? e.data : null, failed: true })),
      )
  }, [url])

  useEffect(() => {
    if (!url) return
    load()
    const id = setInterval(load, every)
    const onVisible = () => document.visibilityState === "visible" && load()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [url, every, load])

  const current = entry?.url === url ? entry : null
  return { data: current?.data ?? null, loading: !!url && !current, failed: current?.failed ?? false, reload: load }
}

export default function ForecastApp({ initialSpot }: { initialSpot: SpotId }) {
  const [spotId, setSpotId] = useState<SpotId>(initialSpot)
  const spot = getSpot(spotId)
  const [weight, changeWeight] = usePref<number>("mk-weight", 75, (r) => {
    const w = Number(r)
    return w >= 40 && w <= 120 ? w : null
  })
  const [view, setView] = usePref<View>("mk-view", "synthese", (r) => (r === "modeles" || r === "synthese" ? r : null))
  const [picked, setPicked] = useState<string | null>(null)
  const [now, setNow] = useState(nowSec)

  useEffect(() => {
    const id = setInterval(() => setNow(nowSec()), 60_000)
    return () => clearInterval(id)
  }, [])

  const changeSpot = (id: SpotId) => {
    setSpotId(id)
    setPicked(null)
    const url = new URL(window.location.href)
    if (id === "faula") url.searchParams.delete("spot")
    else url.searchParams.set("spot", id)
    window.history.replaceState(null, "", url)
  }

  const forecast = useRemote<ForecastResponse>(`/api/forecast?spot=${spotId}`, FORECAST_POLL)
  const station = useRemote<StationResponse>(`/api/station?spot=${spotId}`, STATION_POLL)
  // When the spot's own station is down or missing, show the nearest working one.
  const needRef = spotId !== REFERENCE_SPOT && !station.loading && station.data?.status !== "live"
  const refStation = useRemote<StationResponse>(needRef ? `/api/station?spot=${REFERENCE_SPOT}` : null, STATION_POLL)

  const data = forecast.data?.spot === spotId ? forecast.data : null
  const days = useMemo(() => (data ? summarizeDays(data, spot.offshore) : []), [data, spot.offshore])
  const today = localDate(now)
  // After the session window, jump to tomorrow by default.
  const defaultDay = localHour(now) >= 18 ? (days[1]?.date ?? days[0]?.date) : days[0]?.date
  const selectedDate = picked && days.some((d) => d.date === picked) ? picked : defaultDay
  const selected = days.find((d) => d.date === selectedDate)
  const todayHours = data?.hours.filter((h) => localDate(h.t) === today) ?? []

  const refSpot = getSpot(REFERENCE_SPOT)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10">
      <header className="flex items-center justify-between gap-3 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5 text-ink">
          <KiteMark size={30} />
          <div className="leading-none">
            <p className="text-lg font-bold tracking-tight">Mada Kite</p>
            <p className="text-xs font-medium text-ink-3">Vent · Martinique</p>
          </div>
        </div>
        <Link
          href="/a-propos"
          className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-ink-2 transition-colors duration-150 hover:bg-surface-2"
        >
          <Icon name="info" size={18} /> Infos
        </Link>
      </header>

      <nav aria-label="Spot" className="mb-4">
        <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1">
          {SPOTS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === spotId}
              onClick={() => changeSpot(s.id)}
              className={`min-h-11 rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 ease-out-quart ${
                s.id === spotId ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex flex-col gap-4">
        <LiveStation
          title={spot.station ? `${spot.name} · ${spot.station.label}` : `${spot.name} · pas de balise`}
          station={station.data?.spot === spotId ? station.data : null}
          loading={station.loading}
          failed={station.failed && !station.data}
          forecast={todayHours}
          fallbackWindguruId={spot.station?.kind === "windguru" ? spot.station.id : undefined}
          compact={spot.station == null}
        />
        {needRef && (
          <LiveStation
            title={`${refSpot.name} · balise la plus proche`}
            station={refStation.data}
            loading={refStation.loading}
            failed={refStation.failed && !refStation.data}
            forecast={[]}
            fallbackWindguruId={refSpot.station!.kind === "windguru" ? refSpot.station!.id : undefined}
            compact
          />
        )}

        <section aria-label="Prévisions 7 jours" className="mt-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Prévisions</h2>
            <div role="tablist" aria-label="Affichage" className="grid grid-cols-2 gap-0.5 rounded-xl bg-surface-2 p-0.5">
              {(
                [
                  ["synthese", "Synthèse"],
                  ["modeles", "Modèles"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={view === id}
                  onClick={() => setView(id)}
                  className={`min-h-10 rounded-[0.625rem] px-3 text-sm font-semibold transition-[background-color,color] duration-200 ease-out-quart ${
                    view === id ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink-2"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {forecast.loading && !data ? (
            <ForecastSkeleton />
          ) : !data ? (
            <div className="rounded-2xl bg-surface p-6 text-center shadow-card">
              <p className="font-semibold text-ink">Prévisions indisponibles</p>
              <p className="mt-1 text-sm text-ink-3">Les serveurs météo ne répondent pas. La balise reste consultable.</p>
              <button
                onClick={forecast.reload}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-bg"
              >
                <Icon name="refresh" size={16} /> Réessayer
              </button>
            </div>
          ) : view === "modeles" ? (
            <ModelTable
              data={data}
              nowT={now}
              today={today}
              onOpenDay={(d) => {
                setPicked(d)
                setView("synthese")
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <DayStrip days={days} selected={selectedDate ?? ""} today={today} onSelect={setPicked} />
              {selected && (
                <DayDetail
                  key={`${spotId}-${selected.date}`}
                  day={selected}
                  isToday={selected.date === today}
                  nowT={now}
                  models={data.models}
                  calibration={data.calibration}
                  weight={weight}
                  onWeightChange={changeWeight}
                />
              )}
            </div>
          )}
          {data && (
            <p className={`mt-2 text-right text-xs ${forecast.failed ? "text-warn" : "text-ink-3"}`}>
              {forecast.failed ? "Hors connexion, dernières données · " : ""}
              {data.models.filter((m) => m.available).length} modèles · mis à jour à {fmtClock(data.generatedAt)}
            </p>
          )}
        </section>

        <RadarMap lat={spot.lat} lng={spot.lng} />
      </main>

      <footer className="mt-10 border-t border-line pt-4 text-center text-xs leading-relaxed text-ink-3">
        <p>Modèles via Open-Meteo · Balises Windguru #4164 (Airfly) et Tempest #122730 (CKS)</p>
        <p className="mt-1">
          Fait à la Martinique par{" "}
          <a href="https://www.instagram.com/paulphotopeche/" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-2 underline-offset-4 hover:underline">
            Poloduf
          </a>
          . Ne remplace pas ton jugement sur le spot.
        </p>
      </footer>
    </div>
  )
}

function ForecastSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement des prévisions">
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-[7.25rem] rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  )
}
