"use client"

import { Fragment, useMemo, useState } from "react"
import { fmtWeekday, localDate, localHour } from "@/lib/time"
import { dirLabel, windColor } from "@/lib/wind/scale"
import type { ConsensusHour, ForecastResponse, ModelSkill } from "@/lib/wind/types"
import { DirArrow } from "./icons"

interface Props {
  data: ForecastResponse
  nowT: number
  today: string
  onOpenDay: (date: string) => void
}

type Step = 1 | 3
const HOURS: Record<Step, number[]> = {
  1: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  3: [6, 9, 12, 15, 18],
}

// Day boundary marker, drawn as an inset shadow so it survives coloured cells.
const DAY_EDGE = "shadow-[inset_2px_0_0_var(--ink-3)]"

function Cell({ v, edge, strong }: { v: number | undefined; edge: boolean; strong?: boolean }) {
  if (v == null) {
    return <td className={`h-8 min-w-9 rounded text-center text-xs text-ink-3 ${edge ? DAY_EDGE : ""}`}>·</td>
  }
  const c = windColor(v)
  return (
    <td
      className={`num h-8 min-w-9 rounded text-center ${strong ? "text-base font-bold" : "text-[0.9375rem] font-semibold"} ${edge ? DAY_EDGE : ""}`}
      style={{ background: c.bg, color: c.fg }}
    >
      {v}
    </td>
  )
}

function DirCell({ d, edge }: { d: number | undefined; edge: boolean }) {
  return (
    <td className={`h-7 min-w-9 text-center text-ink-2 ${edge ? DAY_EDGE : ""}`} title={d != null ? `${dirLabel(d)} ${d}°` : undefined}>
      {d != null && <DirArrow deg={d} size={13} className="mx-auto" />}
    </td>
  )
}

function Label({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <th scope="row" className="sticky left-0 z-10 min-w-[4.5rem] bg-surface pr-2 text-left text-xs font-semibold leading-tight text-ink-2">
      {children}
      {sub && <span className="block text-[0.6875rem] font-normal text-ink-3">{sub}</span>}
    </th>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 ${on ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink"}`}
    >
      {children}
    </button>
  )
}

export default function ModelTable({ data, nowT, today, onOpenDay }: Props) {
  const [step, setStep] = useState<Step>(3)
  const [showGust, setShowGust] = useState(true)
  const [showDir, setShowDir] = useState(true)

  const cols = useMemo(() => {
    const keep = new Set(HOURS[step])
    return data.hours.filter((h) => keep.has(localHour(h.t)) && h.t >= nowT - 3600 * (step === 3 ? 2 : 1))
  }, [data.hours, step, nowT])

  const days = useMemo(() => {
    const out: { date: string; span: number }[] = []
    for (const h of cols) {
      const d = localDate(h.t)
      if (out.at(-1)?.date === d) out.at(-1)!.span++
      else out.push({ date: d, span: 1 })
    }
    return out
  }, [cols])

  const models = useMemo(
    () => [...data.models].filter((m) => m.available).sort((a, b) => b.weight - a.weight),
    [data.models],
  )

  const edges = new Set(cols.filter((h, i) => i > 0 && localDate(h.t) !== localDate(cols[i - 1].t)).map((h) => h.t))
  const total = cols.length + 1

  const rowsFor = (pick: (h: ConsensusHour) => { s?: number; g?: number; d?: number }, strong?: boolean) => {
    const hasGust = cols.some((h) => pick(h).g != null)
    return (
    <>
      <tr>
        <Label sub="nœuds">Vent</Label>
        {cols.map((h) => (
          <Cell key={h.t} v={pick(h).s} edge={edges.has(h.t)} strong={strong} />
        ))}
      </tr>
      {showGust && hasGust && (
        <tr>
          <Label>Rafales</Label>
          {cols.map((h) => (
            <Cell key={h.t} v={pick(h).g} edge={edges.has(h.t)} />
          ))}
        </tr>
      )}
      {showDir && (
        <tr>
          <Label>Direction</Label>
          {cols.map((h) => (
            <DirCell key={h.t} d={pick(h).d} edge={edges.has(h.t)} />
          ))}
        </tr>
      )}
    </>
    )
  }

  return (
    <section aria-label="Tableau des modèles" className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Pas de temps" className="flex gap-1">
          <Toggle on={step === 3} onClick={() => setStep(3)}>
            3 h
          </Toggle>
          <Toggle on={step === 1} onClick={() => setStep(1)}>
            1 h
          </Toggle>
        </div>
        <div role="group" aria-label="Lignes affichées" className="flex gap-1">
          <Toggle on={showGust} onClick={() => setShowGust((v) => !v)}>
            Rafales
          </Toggle>
          <Toggle on={showDir} onClick={() => setShowDir((v) => !v)}>
            Direction
          </Toggle>
        </div>
      </div>

      <div className="scroll-x -mx-4 mt-3 px-4 pb-2">
        <table className="border-separate border-spacing-[2px]">
          <caption className="sr-only">Vent prévu par chaque modèle, en nœuds, sur 7 jours</caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface" />
              {days.map((d, i) => (
                <th key={d.date} colSpan={d.span} scope="colgroup" className={`pb-0.5 text-left ${i > 0 ? DAY_EDGE : ""}`}>
                  <button
                    onClick={() => onOpenDay(d.date)}
                    className="min-h-8 whitespace-nowrap rounded-md px-1.5 text-sm font-bold capitalize text-ink hover:bg-surface-2"
                    title="Voir la synthèse de ce jour"
                  >
                    {d.date === today ? "Aujourd'hui" : fmtWeekday(d.date)} {Number(d.date.slice(8))}
                  </button>
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-10 bg-surface" />
              {cols.map((h) => (
                <th key={h.t} scope="col" className={`num h-6 min-w-9 text-center text-xs font-semibold text-ink-3 ${edges.has(h.t) ? DAY_EDGE : ""}`}>
                  {localHour(h.t)}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <GroupHead colSpan={total} title="Consensus Mada Kite" sub="calibré sur la balise" accent />
            {rowsFor((h) => ({ s: Math.round(h.speed), g: Math.round(h.gust), d: h.dir }), true)}
            {models.map((m) => (
              <Fragment key={m.id}>
                <GroupHead colSpan={total} title={m.label} sub={modelSub(m)} />
                {rowsFor((h) => h.models[m.id] ?? {})}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-3">
        Modèles classés du plus fiable au moins fiable, d&apos;après leur écart récent avec la balise. Valeurs déjà corrigées du biais local. Touche un
        jour pour sa synthèse.
      </p>
    </section>
  )
}

function modelSub(m: ModelSkill) {
  const parts = [m.org, `poids ${Math.round(m.weight * 100)} %`]
  if (m.mae != null) parts.push(`écart ±${m.mae.toFixed(1).replace(".", ",")} nd`)
  return parts.join(" · ")
}

function GroupHead({ colSpan, title, sub, accent }: { colSpan: number; title: string; sub: string; accent?: boolean }) {
  return (
    <tr>
      <td colSpan={colSpan} className="pb-0.5 pt-3">
        <span className="sticky left-0 flex items-baseline gap-2 whitespace-nowrap">
          <span className={`text-sm font-bold ${accent ? "text-signal-ink" : "text-ink"}`}>{title}</span>
          <span className="text-xs text-ink-3">{sub}</span>
        </span>
      </td>
    </tr>
  )
}
