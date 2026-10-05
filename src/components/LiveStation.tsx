"use client"

import { fmtAgo, fmtClock, fmtHour, localHour } from "@/lib/time"
import { dirLabel, kiteability, windColor } from "@/lib/wind/scale"
import type { ConsensusHour, StationResponse } from "@/lib/wind/types"
import { DirArrow } from "./icons"

interface Props {
  title: string
  station: StationResponse | null
  loading: boolean
  failed: boolean
  forecast: ConsensusHour[]
  /** Windguru station id: embed the official widget if our feed fails. */
  fallbackWindguruId?: number
  compact?: boolean
}

export default function LiveStation({ title, station, loading, failed, forecast, fallbackWindguruId, compact }: Props) {
  if (loading && !station) {
    return (
      <section aria-label={title} className="rounded-2xl bg-surface p-4 shadow-card">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="mt-4 flex gap-4">
          <div className="skeleton size-20 rounded-xl" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        </div>
      </section>
    )
  }

  if (failed || !station) {
    if (fallbackWindguruId) {
      return (
        <section aria-label={title} className="overflow-hidden rounded-2xl bg-surface shadow-card">
          <Header title={title} status="live" />
          <iframe
            src={`https://www.windguru.cz/wgs-iframe.php?s=${fallbackWindguruId}&wj=knots&tj=c&tmprh=1&avg_min=0`}
            className="block h-[68px] w-full"
            title="Balise vent en direct (Windguru)"
          />
        </section>
      )
    }
    return (
      <section aria-label={title} className="rounded-2xl bg-surface p-4 shadow-card">
        <Header title={title} status="offline" />
        <p className="mt-2 text-sm text-ink-2">Balise injoignable pour le moment. Nouvel essai automatique dans 2 minutes.</p>
      </section>
    )
  }

  const now = station.now
  const hasWind = now?.avg != null

  return (
    <section aria-label={title} className="rounded-2xl bg-surface p-4 shadow-card">
      <Header
        title={title}
        status={station.status}
        right={now && station.status !== "offline" ? fmtAgo(now.t) : null}
      />

      {hasWind && station.status !== "offline" ? (
        <>
          <div className="mt-3 flex items-center gap-4">
            <BigWind kts={now!.avg!} compact={compact} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-ink">
                {now!.dir != null && <DirArrow deg={now!.dir} size={20} />}
                <span className="text-lg font-semibold">
                  {now!.dir != null ? `${dirLabel(now!.dir)} ` : ""}
                  <span className="num font-medium text-ink-3">{now!.dir != null ? `${now!.dir}°` : ""}</span>
                </span>
              </div>
              <dl className="mt-1 flex gap-4 text-sm text-ink-2">
                {now!.max != null && (
                  <div>
                    <dt className="sr-only">Rafales</dt>
                    <dd>
                      Rafales <span className="num text-base font-semibold text-ink">{Math.round(now!.max)}</span>
                    </dd>
                  </div>
                )}
                {now!.min != null && (
                  <div>
                    <dt className="sr-only">Molles</dt>
                    <dd>
                      Molles <span className="num text-base font-semibold text-ink">{Math.round(now!.min)}</span>
                    </dd>
                  </div>
                )}
              </dl>
              <p className="mt-1 text-sm font-medium text-ink-2">{kiteability(now!.avg!).label}</p>
            </div>
          </div>
          {!compact && station.history.length > 6 && <Sparkline station={station} forecast={forecast} />}
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-2">
          {station.status === "none"
            ? "Aucune balise sur ce spot. La plus proche est affichée ci-dessous."
            : station.status === "offline" && now
            ? `Anémomètre hors ligne (dernier relevé le ${new Date(now.t * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}).`
            : "Pas de mesure de vent disponible."}
          {station.battery != null && station.battery < 2.3 && ` Batterie faible (${station.battery.toFixed(2)} V).`}
        </p>
      )}
    </section>
  )
}

function Header({ title, status, right }: { title: string; status: StationResponse["status"]; right?: string | null }) {
  const live = status === "live"
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2">
          <span
            aria-hidden
            className={`size-2 rounded-full ${live ? "live-dot bg-good" : status === "stale" ? "bg-warn" : "bg-ink-3"}`}
          />
          <span className="eyebrow">{live ? "En direct" : status === "stale" ? "Mesure en retard" : status === "none" ? "Balise" : "Hors ligne"}</span>
        </p>
        {right && <span className="text-xs text-ink-3">{right}</span>}
      </div>
      <h2 className="mt-0.5 text-base font-semibold text-ink">{title}</h2>
    </div>
  )
}

function BigWind({ kts, compact }: { kts: number; compact?: boolean }) {
  const c = windColor(kts)
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-xl ${compact ? "size-16" : "size-[5.5rem]"}`}
      style={{ background: c.bg, color: c.fg }}
    >
      <span className={`num font-bold leading-none ${compact ? "text-4xl" : "text-[3.25rem]"}`}>{Math.round(kts)}</span>
      <span className="text-xs font-semibold opacity-80">nœuds</span>
    </div>
  )
}

// ── 12 h sparkline: measured vs forecast ─────────────────────────────────────

function Sparkline({ station, forecast }: { station: StationResponse; forecast: ConsensusHour[] }) {
  const pts = station.history.filter((r) => r.avg != null)
  const t0 = pts[0].t
  const t1 = Math.max(pts[pts.length - 1].t, station.now?.t ?? 0)
  const fc = forecast.filter((h) => h.t >= t0 - 1800 && h.t <= t1 + 1800)
  const values = [...pts.map((r) => r.max ?? r.avg!), ...fc.map((h) => h.speed)]
  // Zoom on the useful range, but keep the 14 kts reference visible.
  const yMax = Math.max(16, Math.ceil((Math.max(...values) + 1) / 2) * 2)
  const yMin = Math.max(0, Math.min(12, Math.floor((Math.min(...pts.map((r) => r.min ?? r.avg!), ...fc.map((h) => h.speed)) - 1) / 2) * 2))
  const W = 320
  const H = 64
  const x = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * W
  const y = (v: number) => H - ((v - yMin) / (yMax - yMin)) * H

  const band =
    pts.map((r, i) => `${i ? "L" : "M"}${x(r.t).toFixed(1)},${y(r.max ?? r.avg!).toFixed(1)}`).join("") +
    [...pts].reverse().map((r) => `L${x(r.t).toFixed(1)},${y(r.min ?? r.avg!).toFixed(1)}`).join("") +
    "Z"
  const line = pts.map((r, i) => `${i ? "L" : "M"}${x(r.t).toFixed(1)},${y(r.avg!).toFixed(1)}`).join("")
  const fcLine = fc.map((h, i) => `${i ? "L" : "M"}${x(h.t).toFixed(1)},${y(h.speed).toFixed(1)}`).join("")

  const ticks: number[] = []
  for (let t = Math.ceil(t0 / 10800) * 10800; t <= t1; t += 10800) ticks.push(t)
  const ref = y(14)

  const last = pts[pts.length - 1]
  const lastFc = fc.reduce<ConsensusHour | null>((a, h) => (!a || Math.abs(h.t - last.t) < Math.abs(a.t - last.t) ? h : a), null)
  const delta = lastFc ? Math.round(last.avg! - lastFc.speed) : null

  return (
    <figure className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H + 16}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`Vent mesuré sur les ${Math.round((t1 - t0) / 3600)} dernières heures comparé à la prévision`}
      >
        <line x1="0" x2={W} y1={ref} y2={ref} stroke="var(--line)" strokeDasharray="2 3" />
        <text x={W} y={ref - 3} textAnchor="end" className="fill-ink-3" fontSize="9">
          14 nds
        </text>
        <path d={band} fill="var(--ink)" opacity="0.08" />
        {fcLine && <path d={fcLine} fill="none" stroke="var(--signal)" strokeWidth="1.6" strokeDasharray="4 3" />}
        <path d={line} fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H + 13} textAnchor="middle" className="fill-ink-3" fontSize="9">
            {fmtHour(t)}
          </text>
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 bg-ink" /> Mesuré
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0 w-4 border-t-2 border-dashed border-signal" /> Prévu
        </span>
        {delta != null && localHour(last.t) >= 6 && (
          <span className="ml-auto">
            {delta === 0
              ? `Prévision juste à ${fmtClock(last.t)}`
              : `Réel ${delta > 0 ? "+" : ""}${delta} nd${Math.abs(delta) > 1 ? "s" : ""} vs prévu`}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
