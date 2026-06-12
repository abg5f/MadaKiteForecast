"use client"

import { createContext, useContext, useState } from "react"
import { SPOTS, type Spot } from "@/lib/spots"

type SpotCtx = { spot: Spot; setSpot: (s: Spot) => void }

const SpotContext = createContext<SpotCtx>({ spot: SPOTS[0], setSpot: () => {} })

export function SpotProvider({ children }: { children: React.ReactNode }) {
  const [spot, setSpot] = useState<Spot>(SPOTS[0])
  return <SpotContext.Provider value={{ spot, setSpot }}>{children}</SpotContext.Provider>
}

export function useSpot() {
  return useContext(SpotContext)
}
