"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type SourceFilter = "average" | "windy" | "windguru"

interface Props {
  value: SourceFilter
  onChange: (v: SourceFilter) => void
  windyAvailable: boolean
  windguruAvailable: boolean
}

export default function FilterToggle({ value, onChange, windyAvailable, windguruAvailable }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as SourceFilter)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="average">Moyenne</TabsTrigger>
        <TabsTrigger value="windy" disabled={!windyAvailable}>
          Windy
        </TabsTrigger>
        <TabsTrigger value="windguru" disabled={!windguruAvailable}>
          Windguru
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
