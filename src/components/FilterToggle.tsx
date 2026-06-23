"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { ModelType, AggregatedForecast } from "@/lib/api-clients"

const MODELS: { value: ModelType; label: string }[] = [
  { value: "AROME", label: "AROME" },
  { value: "GFS",   label: "GFS" },
  { value: "ICON",  label: "ICON" },
  { value: "ERA5",  label: "ERA5" },
]

interface GliderTabsProps<T extends string> {
  options: { value: T; label: string; disabled?: boolean; title?: string }[]
  value: T
  onChange: (v: T) => void
}

function GliderTabs<T extends string>({ options, value, onChange }: GliderTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const [glider, setGlider] = useState({ left: 0, width: 0 })
  const activeIdx = options.findIndex((o) => o.value === value)

  useLayoutEffect(() => {
    const el = refs.current[activeIdx]
    if (el) setGlider({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeIdx, options.length])

  return (
    <div style={{
      position: "relative", display: "flex",
      background: "var(--surface)", borderRadius: "var(--r-pill)", padding: 3,
    }}>
      <div aria-hidden style={{
        position: "absolute", top: 3,
        left: glider.left, width: glider.width, height: 34,
        borderRadius: "var(--r-pill)", background: "var(--brand)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transition: "left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: "none",
      }} />
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => { refs.current[i] = el }}
          onClick={() => !opt.disabled && onChange(opt.value)}
          disabled={opt.disabled}
          title={opt.title}
          style={{
            flex: 1, height: 34, borderRadius: "var(--r-pill)",
            border: "none", background: "transparent",
            color: opt.disabled ? "var(--faint)" : opt.value === value ? "#fff" : "var(--muted-text)",
            fontWeight: opt.value === value ? 600 : 400,
            fontSize: 13, cursor: opt.disabled ? "default" : "pointer",
            position: "relative", zIndex: 1,
            transition: "color 0.18s", whiteSpace: "nowrap", padding: "0 8px",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface Props {
  model: ModelType
  onModelChange: (m: ModelType) => void
  data: AggregatedForecast | null
}

export default function FilterToggle({ model, onModelChange, data }: Props) {
  const errors = data?.errors ?? {}
  const modelOptions = MODELS.map((m) => ({
    ...m,
    disabled: data?.openMeteo?.[m.value] == null,
    title: errors[m.value] ?? undefined,
  }))

  return <GliderTabs options={modelOptions} value={model} onChange={onModelChange} />
}
