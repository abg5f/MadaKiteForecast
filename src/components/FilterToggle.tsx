"use client"

import type { ModelType, AggregatedForecast } from "@/lib/api-clients"

export type SourceFilter = "average" | "openmeteo" | "stormglass" | "yr"

const SOURCES: { value: SourceFilter; label: string }[] = [
  { value: "average",    label: "Moyenne" },
  { value: "openmeteo", label: "Open-Meteo" },
  { value: "stormglass", label: "Stormglass" },
  { value: "yr",        label: "Yr.no" },
]

const MODELS: { value: ModelType; label: string }[] = [
  { value: "GFS",   label: "GFS" },
  { value: "ICON",  label: "ICON" },
  { value: "ERA5",  label: "ERA5" },
  { value: "AROME", label: "AROME" },
]

interface PillTabsProps<T extends string> {
  options: { value: T; label: string; disabled?: boolean }[]
  value: T
  onChange: (v: T) => void
  small?: boolean
}

function PillTabs<T extends string>({ options, value, onChange, small }: PillTabsProps<T>) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface)",
        borderRadius: "var(--r-pill)",
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => !opt.disabled && onChange(opt.value)}
            disabled={opt.disabled}
            style={{
              flex: 1,
              height: small ? 30 : 36,
              borderRadius: "var(--r-pill)",
              border: "none",
              background: active ? "var(--brand)" : "transparent",
              color: active ? "#fff" : opt.disabled ? "var(--border)" : "var(--muted-foreground)",
              fontWeight: active ? 600 : 400,
              fontSize: small ? 12 : 13,
              cursor: opt.disabled ? "default" : "pointer",
              transition: "background 0.18s, color 0.18s",
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  source: SourceFilter
  model: ModelType
  onSourceChange: (s: SourceFilter) => void
  onModelChange: (m: ModelType) => void
  data: AggregatedForecast | null
}

export default function FilterToggle({ source, model, onSourceChange, onModelChange, data }: Props) {
  const sourceOptions = SOURCES.map((s) => ({
    ...s,
    disabled:
      s.value === "stormglass" ? !data?.stormglass :
      s.value === "yr"         ? !data?.yr         : false,
  }))

  const modelOptions = MODELS.map((m) => ({
    ...m,
    disabled: data?.openMeteo?.[m.value] == null,
  }))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <PillTabs options={sourceOptions} value={source} onChange={onSourceChange} />
      {source === "openmeteo" && (
        <PillTabs options={modelOptions} value={model} onChange={onModelChange} small />
      )}
    </div>
  )
}
