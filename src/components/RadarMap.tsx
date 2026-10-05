"use client"

import { useState } from "react"
import { Icon } from "./icons"

const LAYERS = [
  { id: "wind", label: "Vent" },
  { id: "radar", label: "Pluie" },
  { id: "satellite", label: "Satellite" },
  { id: "waves", label: "Houle" },
] as const

export default function RadarMap({ lat, lng }: { lat: number; lng: number }) {
  const [open, setOpen] = useState(false)
  const [layer, setLayer] = useState<(typeof LAYERS)[number]["id"]>("wind")

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-semibold text-ink-2 shadow-card transition-colors duration-150 hover:bg-surface-2"
      >
        <Icon name="map" size={18} /> Carte animée vent, pluie et houle
      </button>
    )
  }

  const src =
    `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&detailLat=${lat}&detailLon=${lng}&zoom=9` +
    `&level=surface&overlay=${layer}&product=ecmwf&menu=&message=true&marker=true&calendar=now` +
    `&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`

  return (
    <section aria-label="Carte météo" className="overflow-hidden rounded-2xl bg-surface shadow-card">
      <div role="tablist" aria-label="Couche de la carte" className="flex gap-1 p-2">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            role="tab"
            aria-selected={layer === l.id}
            onClick={() => setLayer(l.id)}
            className={`min-h-10 flex-1 rounded-lg text-sm font-semibold transition-colors duration-150 ${
              layer === l.id ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <iframe key={layer} src={src} className="block h-[26rem] w-full" title="Carte météo Windy" loading="lazy" allow="fullscreen" />
    </section>
  )
}
