import { dirLabel } from "@/lib/wind/scale"

export function KiteMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path d="M4 15.5C4 8.5 9.4 4 16 4s12 4.5 12 11.5c-3.6-2.2-7.6-3-12-3s-8.4.8-12 3Z" fill="var(--signal)" />
      <path d="M16 4v8.5" stroke="var(--bg)" strokeWidth="1.2" opacity="0.6" />
      <path d="M5 15.2 14.6 26M27 15.2 17.4 26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 27.5h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** Arrow pointing where the wind blows to (Windguru convention). */
export function DirArrow({ deg, size = 16, className }: { deg: number; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      role="img"
      aria-label={`Vent de ${dirLabel(deg)}`}
      style={{ transform: `rotate(${deg + 180}deg)` }}
    >
      <path d="M8 1.5 12.5 13 8 10.4 3.5 13Z" fill="currentColor" />
    </svg>
  )
}

export function Stars({ count, size = 10 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-[3px]" role="img" aria-label={`${count} sur 3`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 10 10" aria-hidden>
          <path
            d="M5 .6 6.3 3.5l3.1.3-2.4 2 .7 3.1L5 7.3 2.3 8.9 3 5.8.6 3.8l3.1-.3Z"
            fill={i <= count ? "var(--signal)" : "var(--line)"}
          />
        </svg>
      ))}
    </span>
  )
}

export function Icon({ name, size = 16, className }: { name: "info" | "map" | "rain" | "bolt" | "alert" | "refresh" | "chevron" | "back"; size?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, className }
  switch (name) {
    case "info":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
    case "map":
      return <svg {...common}><path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>
    case "rain":
      return <svg {...common}><path d="M7 15a5 5 0 1 1 9.6-2H17a3.5 3.5 0 0 1 0 7H8" /><path d="M8 19v2M12 19v2" /></svg>
    case "bolt":
      return <svg {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7Z" /></svg>
    case "alert":
      return <svg {...common}><path d="M12 3 2 20h20Z" /><path d="M12 10v4M12 17h.01" /></svg>
    case "refresh":
      return <svg {...common}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
    case "chevron":
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>
    case "back":
      return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
  }
}
