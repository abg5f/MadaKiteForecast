"use client"

import { fmtWeekday } from "@/lib/time"
import type { DaySummary } from "@/lib/wind/days"
import { windColor } from "@/lib/wind/scale"
import { Stars } from "./icons"

interface Props {
  days: DaySummary[]
  selected: string
  today: string
  onSelect: (date: string) => void
}

export default function DayStrip({ days, selected, today, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="Choisir un jour" className="grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const active = d.date === selected
        const c = windColor(d.peak)
        const label = d.date === today ? "Auj." : fmtWeekday(d.date)
        return (
          <button
            key={d.date}
            role="tab"
            aria-selected={active}
            aria-label={`${fmtWeekday(d.date, "long")} ${Number(d.date.slice(8))}, jusqu'à ${Math.round(d.peak)} nœuds, ${d.stars} étoile${d.stars > 1 ? "s" : ""}`}
            onClick={() => onSelect(d.date)}
            className={`group flex min-h-[7.25rem] flex-col items-center gap-1.5 rounded-xl px-0.5 pb-2 pt-1.5 transition-[background-color,box-shadow] duration-200 ease-out-quart ${
              active ? "bg-surface shadow-card ring-2 ring-ink" : "hover:bg-surface/70"
            }`}
          >
            <span className={`text-xs font-semibold capitalize ${active ? "text-ink" : "text-ink-2"}`}>{label}</span>
            <span className="num -mt-1 text-xs text-ink-3">{Number(d.date.slice(8))}</span>
            <span
              className="num flex h-11 w-full max-w-12 items-center justify-center rounded-lg text-2xl font-bold"
              style={{ background: c.bg, color: c.fg }}
            >
              {Math.round(d.peak)}
            </span>
            <Stars count={d.stars} size={9} />
          </button>
        )
      })}
    </div>
  )
}
