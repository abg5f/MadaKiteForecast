"use client"

import { fmtDayMonth, fmtHour, fmtWeekday, localHour } from "@/lib/time"
import type { DaySummary } from "@/lib/wind/days"
import { dirLabel, kiteSize } from "@/lib/wind/scale"
import type { Calibration, ModelSkill } from "@/lib/wind/types"
import HourGrid from "./HourGrid"
import { DirArrow, Icon } from "./icons"
import WindChart from "./WindChart"

interface Props {
  day: DaySummary
  isToday: boolean
  nowT: number
  models: ModelSkill[]
  calibration: Calibration
  weight: number
  onWeightChange: (kg: number) => void
}

const CONF_STYLE = {
  high: "bg-good-soft text-good",
  medium: "bg-warn-soft text-warn",
  low: "bg-danger-soft text-danger",
} as const

const WEIGHTS = Array.from({ length: 15 }, (_, i) => 45 + i * 5)

export default function DayDetail({ day, isToday, nowT, models, calibration, weight, onWeightChange }: Props) {
  const w = day.window
  const midSpeed = w ? (w.min + w.max) / 2 : day.peak
  const kite = kiteSize(weight, midSpeed)
  const nowHour = isToday ? localHour(nowT) : null
  const title = isToday ? "Aujourd'hui" : fmtWeekday(day.date, "long")

  return (
    <section aria-labelledby="day-title" className="rounded-2xl bg-surface p-4 shadow-card">
      <header>
        <h2 id="day-title" className="text-sm text-ink-3">
          <span className="font-semibold capitalize text-ink-2">{title}</span> · {fmtDayMonth(day.date)}
        </h2>

        {w ? (
          <p className="mt-1 text-[1.625rem] font-bold leading-tight text-ink">
            {w.light ? "Léger" : "Navigable"} de <span className="num">{fmtHour(w.from)}</span> à{" "}
            <span className="num">{fmtHour(w.to + 3600)}</span>
          </p>
        ) : (
          <p className="mt-1 text-[1.625rem] font-bold leading-tight text-ink">Pas de créneau navigable</p>
        )}

        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-base text-ink-2">
          {w ? (
            <span>
              <span className="num text-lg font-semibold text-ink">
                {Math.round(w.min)}–{Math.round(w.max)}
              </span>{" "}
              nœuds
            </span>
          ) : (
            <span>
              Vent max <span className="num text-lg font-semibold text-ink">{Math.round(day.peak)}</span> nœuds
            </span>
          )}
          <span aria-hidden className="text-ink-3">·</span>
          <span>
            rafales <span className="num text-lg font-semibold text-ink">{Math.round(day.peakGust)}</span>
          </span>
          {day.dir != null && (
            <>
              <span aria-hidden className="text-ink-3">·</span>
              <span className="flex items-center gap-1">
                <DirArrow deg={day.dir} size={14} /> {dirLabel(day.dir)}
              </span>
            </>
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${CONF_STYLE[day.confidence]}`}>
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {day.confidenceLabel}
          </span>
          {day.offshore && (
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-danger-soft px-2.5 text-xs font-semibold text-danger">
              <Icon name="alert" size={13} /> Vent de terre
            </span>
          )}
          {day.storm && (
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-danger-soft px-2.5 text-xs font-semibold text-danger">
              <Icon name="bolt" size={13} /> Risque d&apos;orage
            </span>
          )}
          {!day.storm && day.rainMax != null && day.rainMax >= 40 && (
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs font-semibold text-ink-2">
              <Icon name="rain" size={13} /> Averses {day.rainMax}%
            </span>
          )}
          {day.modelCount < models.filter((m) => m.available).length && (
            <span className="inline-flex min-h-7 items-center rounded-full bg-surface-2 px-2.5 text-xs font-medium text-ink-3">
              {day.modelCount} modèles à cette échéance
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface-2 py-2 pl-3 pr-2">
          <p className="min-w-0 text-sm leading-tight text-ink-2">
            <span className="block">Aile conseillée</span>
            <span className="num whitespace-nowrap text-2xl font-bold text-ink">{kite ? `${kite} m²` : midSpeed < 11 ? "Foil" : "–"}</span>
          </p>
          <label className="shrink-0 text-right text-xs leading-tight text-ink-3">
            <span className="mb-1 block">Pour un rider de</span>
            <select
              value={weight}
              onChange={(e) => onWeightChange(Number(e.target.value))}
              className="num min-h-10 rounded-lg border border-line bg-surface px-2 text-base font-semibold text-ink"
            >
              {WEIGHTS.map((kg) => (
                <option key={kg} value={kg}>
                  {kg} kg
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="mt-5">
        <WindChart hours={day.hours} nowT={isToday ? nowT : null} />
      </div>

      <div className="mt-5">
        <HourGrid hours={day.hours} models={models} weight={weight} nowHour={nowHour} />
      </div>

      <CalibrationNote calibration={calibration} models={models} />
    </section>
  )
}

function CalibrationNote({ calibration, models }: { calibration: Calibration; models: ModelSkill[] }) {
  const top = [...models].filter((m) => m.weight > 0).sort((a, b) => b.weight - a.weight).slice(0, 3)
  const bias = calibration.meanBias
  return (
    <p className="mt-4 text-sm leading-relaxed text-ink-3">
      {calibration.status === "none" ? (
        <>Consensus pondéré de {models.filter((m) => m.available).length} modèles. Balise indisponible : pas de calibration aujourd&apos;hui.</>
      ) : (
        <>
          Calibré {calibration.status === "regional" ? "via la balise de Faula" : "sur la balise du spot"} ({calibration.hours} dernières heures mesurées).
          {Math.abs(bias) >= 0.5 && <> Ici les modèles {bias > 0 ? "sous-estiment" : "surestiment"} le vent d&apos;environ {Math.abs(bias).toFixed(1).replace(".", ",")} nd, corrigé.</>}{" "}
          Plus fiables en ce moment : {top.map((m) => m.label).join(", ")}.
        </>
      )}{" "}
      <a href="/a-propos#methode" className="font-semibold text-ink-2 underline decoration-line underline-offset-4 hover:text-ink">
        La méthode
      </a>
    </p>
  )
}
