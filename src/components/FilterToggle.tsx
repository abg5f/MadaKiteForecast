"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ModelType, AggregatedForecast } from "@/lib/api-clients"

export type SourceFilter = "average" | "openmeteo" | "stormglass" | "yr"

const MODELS: { value: ModelType; label: string }[] = [
  { value: "GFS",   label: "GFS" },
  { value: "ICON",  label: "ICON" },
  { value: "ERA5",  label: "ERA5" },
  { value: "AROME", label: "AROME" },
]

interface Props {
  source: SourceFilter
  model: ModelType
  onSourceChange: (s: SourceFilter) => void
  onModelChange: (m: ModelType) => void
  data: AggregatedForecast | null
}

export default function FilterToggle({ source, model, onSourceChange, onModelChange, data }: Props) {
  return (
    <div className="space-y-2">
      {/* Row 1: Source */}
      <Tabs value={source} onValueChange={(v) => onSourceChange(v as SourceFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="average">Moyenne</TabsTrigger>
          <TabsTrigger value="openmeteo">Open-Meteo</TabsTrigger>
          <TabsTrigger value="stormglass" disabled={!data?.stormglass}>
            Stormglass
          </TabsTrigger>
          <TabsTrigger value="yr" disabled={!data?.yr}>
            Yr.no
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Row 2: Model (only when Open-Meteo is selected) */}
      {source === "openmeteo" && (
        <Tabs value={model} onValueChange={(v) => onModelChange(v as ModelType)}>
          <TabsList className="grid w-full grid-cols-4">
            {MODELS.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                disabled={data?.openMeteo?.[value] == null}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  )
}
