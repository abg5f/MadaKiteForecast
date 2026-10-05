"use client"

import { useState } from "react"
import { localHour } from "@/lib/time"
import { confidence, dirLabel, kiteSize, windColor } from "@/lib/wind/scale"
import type { ConsensusHour, ModelSkill } from "@/lib/wind/types"
import { DirArrow, Icon } from "./icons"

interface Props {
  hours: ConsensusHour[]
  models: ModelSkill[]
  weight: number
  nowHour: number | null
}

const CONF_COLOR = { high: "var(--good)", medium: "var(--warn)", low: "var(--danger)" } as const

function WindTd({ v, soft }: { v: number | undefined; soft?: boolean }) {
  if (v == null) return <td className="h-9 rounded-md bg-surface-2/60 text-center text-xs text-ink-3">–</td>
  const c = windColor(v)
  return (
    <td
      className={`num h-9 rounded-md text-center font-semibold ${soft ? "text-base" : "text-lg"}`}
      style={{ background: c.bg, color: c.fg }}
    >
      {Math.round(v)}
    </td>
  )
}

function RowHead({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <th
      scope="row"
      className="sticky left-0 z-10 bg-surface pr-2 text-left align-middle text-xs font-semibold leading-tight text-ink-2"
    >
      {children}
      {sub && <span className="block text-[0.6875rem] font-normal text-ink-3">{sub}</span>}
    </th>
  )
}

export default function HourGrid({ hours, models, weight, nowHour }: Props) {
  const [showModels, setShowModels] = useState(false)
  const hasObs = hours.some((h) => h.obs != null)
  const available = models.filter((m) => hours.some((h) => h.models[m.id] != null))

  return (
    <div>
      <div className="scroll-x -mx-4 px-4 pb-1">
        <table className="w-full min-w-[36rem] border-separate border-spacing-[3px]">
          <caption className="sr-only">Prévision heure par heure, vitesses en nœuds</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-[4.75rem] bg-surface" />
              {hours.map((h) => {
                const lh = localHour(h.t)
                const isNow = lh === nowHour
                return (
                  <th
                    key={h.t}
                    scope="col"
                    className={`num pb-1 text-center text-sm font-semibold ${isNow ? "text-signal-ink" : "text-ink-2"}`}
                  >
                    {String(lh).padStart(2, "0")}h
                    <span aria-hidden className={`mx-auto mt-0.5 block h-0.5 w-5 rounded ${isNow ? "bg-signal" : "bg-transparent"}`} />
                    {isNow && <span className="sr-only"> (maintenant)</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <RowHead sub="nœuds">Vent</RowHead>
              {hours.map((h) => (
                <WindTd key={h.t} v={h.speed} />
              ))}
            </tr>
            <tr>
              <RowHead>Rafales</RowHead>
              {hours.map((h) => (
                <WindTd key={h.t} v={h.gust} soft />
              ))}
            </tr>
            {hasObs && (
              <tr>
                <RowHead sub="balise">Mesuré</RowHead>
                {hours.map((h) =>
                  h.obs != null ? (
                    <td key={h.t} className="num h-8 rounded-md border border-line text-center text-base font-semibold text-ink">
                      {Math.round(h.obs)}
                    </td>
                  ) : (
                    <td key={h.t} />
                  ),
                )}
              </tr>
            )}
            <tr>
              <RowHead>Direction</RowHead>
              {hours.map((h) => (
                <td key={h.t} className="h-11 text-center text-ink">
                  <DirArrow deg={h.dir} size={16} className="mx-auto" />
                  <span className="block text-[0.6875rem] font-medium text-ink-3">{dirLabel(h.dir)}</span>
                </td>
              ))}
            </tr>
            <tr>
              <RowHead sub={`${weight} kg`}>Aile</RowHead>
              {hours.map((h) => {
                const s = kiteSize(weight, h.speed)
                return (
                  <td key={h.t} className="num h-8 text-center text-sm font-medium text-ink-2">
                    {s ? `${s}` : <span className="text-ink-3">–</span>}
                  </td>
                )
              })}
            </tr>
            <tr>
              <RowHead sub="probabilité">Pluie</RowHead>
              {hours.map((h) => {
                const p = h.rainProb ?? null
                const wet = p != null && p >= 40
                return (
                  <td key={h.t} className={`num h-8 text-center text-sm ${wet ? "font-semibold text-ink" : "text-ink-3"}`}>
                    {p == null || p < 10 ? "" : `${p}%`}
                  </td>
                )
              })}
            </tr>
            <tr>
              <RowHead sub="des modèles">Accord</RowHead>
              {hours.map((h) => {
                const c = confidence(h.spread)
                return (
                  <td key={h.t} className="h-8 text-center" title={`${c.label} (écart ±${h.spread} nd)`}>
                    <span
                      className="mx-auto block size-2.5 rounded-full"
                      style={{ background: CONF_COLOR[c.level] }}
                      aria-label={c.label}
                      role="img"
                    />
                  </td>
                )
              })}
            </tr>

            {showModels &&
              available.map((m, idx) => (
                <tr key={m.id}>
                  <RowHead sub={`poids ${Math.round(m.weight * 100)}%`}>
                    {idx === 0 && <span className="sr-only">Détail par modèle : </span>}
                    {m.label}
                  </RowHead>
                  {hours.map((h) => (
                    <WindTd key={h.t} v={h.models[m.id]?.s} soft />
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => setShowModels((v) => !v)}
        aria-expanded={showModels}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-ink-2 transition-colors duration-150 hover:bg-surface-2"
      >
        {showModels ? "Masquer le détail des modèles" : `Comparer les ${available.length} modèles`}
        <Icon name="chevron" size={16} className={`transition-transform duration-200 ${showModels ? "rotate-180" : ""}`} />
      </button>
    </div>
  )
}
