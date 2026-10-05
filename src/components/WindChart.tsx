"use client"

import { localHour } from "@/lib/time"
import type { ConsensusHour } from "@/lib/wind/types"

interface Props {
  hours: ConsensusHour[]
  nowT: number | null
}

/** Day profile: consensus line, model range band, gusts, measured wind. */
export default function WindChart({ hours, nowT }: Props) {
  if (hours.length < 2) return null
  const W = 340
  const H = 120
  const pad = { l: 22, r: 6, t: 8, b: 18 }
  const t0 = hours[0].t
  const t1 = hours[hours.length - 1].t
  const maxV = Math.max(...hours.map((h) => Math.max(h.gust, h.max, h.obs ?? 0)))
  const yMax = Math.max(20, Math.ceil((maxV + 2) / 5) * 5)
  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b)
  const path = (pts: [number, number][]) => pts.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)},${b.toFixed(1)}`).join("")

  const band =
    path(hours.map((h) => [x(h.t), y(h.max)])) +
    hours
      .slice()
      .reverse()
      .map((h) => `L${x(h.t).toFixed(1)},${y(h.min).toFixed(1)}`)
      .join("") +
    "Z"
  const line = path(hours.map((h) => [x(h.t), y(h.speed)]))
  const gust = path(hours.map((h) => [x(h.t), y(h.gust)]))
  const obs = hours.filter((h) => h.obs != null)
  const gridLines = Array.from({ length: yMax / 5 + 1 }, (_, i) => i * 5)
  const showNow = nowT != null && nowT >= t0 && nowT <= t1

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Profil du vent de ${localHour(t0)}h à ${localHour(t1)}h : de ${Math.round(Math.min(...hours.map((h) => h.speed)))} à ${Math.round(Math.max(...hours.map((h) => h.speed)))} nœuds`}
      >
        {gridLines.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={v === 15 ? "var(--line)" : "var(--line-soft)"} strokeWidth="1" />
            <text x={pad.l - 5} y={y(v) + 3} textAnchor="end" fontSize="9" className="fill-ink-3 num">
              {v}
            </text>
          </g>
        ))}
        {hours
          .filter((_, i) => i % 2 === 0)
          .map((h) => (
            <text key={h.t} x={x(h.t)} y={H - 4} textAnchor="middle" fontSize="9" className="fill-ink-3 num">
              {localHour(h.t)}h
            </text>
          ))}
        <path d={band} fill="var(--ink)" opacity="0.09" />
        <path d={gust} fill="none" stroke="var(--ink-3)" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d={line} fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {obs.map((h) => (
          <circle key={h.t} cx={x(h.t)} cy={y(h.obs!)} r="3.2" fill="var(--signal)" stroke="var(--surface)" strokeWidth="1.2" />
        ))}
        {showNow && (
          <line x1={x(nowT!)} x2={x(nowT!)} y1={pad.t} y2={H - pad.b} stroke="var(--signal)" strokeWidth="1.5" />
        )}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 bg-ink" /> Consensus
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-4 rounded-sm bg-ink/10" /> Écart des modèles
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0 w-4 border-t border-dashed border-ink-3" /> Rafales
        </span>
        {obs.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-signal" /> Mesuré
          </span>
        )}
      </figcaption>
    </figure>
  )
}
