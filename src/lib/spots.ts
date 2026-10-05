export type SpotId = "faula" | "capest" | "chevalier"

export type StationConfig =
  | { kind: "windguru"; id: number; label: string; owner: string }
  | { kind: "tempest"; id: number; deviceId: number; label: string; owner: string }

export type Spot = {
  id: SpotId
  name: string
  short: string
  lat: number
  lng: number
  /** Wind directions (degrees, "from") that blow offshore at this spot: dangerous. */
  offshore: [number, number]
  /** Live station physically on (or next to) the spot. */
  station: StationConfig | null
}

export const SPOTS: Spot[] = [
  {
    id: "faula",
    name: "Pointe Faula",
    short: "Faula",
    lat: 14.55,
    lng: -60.83,
    offshore: [200, 340],
    station: { kind: "windguru", id: 4164, label: "Balise Airfly", owner: "Windguru #4164" },
  },
  {
    id: "capest",
    name: "Cap Est",
    short: "Cap Est",
    lat: 14.58859,
    lng: -60.84985,
    offshore: [200, 340],
    station: { kind: "tempest", id: 122730, deviceId: 310915, label: "Balise CKS", owner: "Tempest #122730" },
  },
  {
    id: "chevalier",
    name: "Cap Chevalier",
    short: "Chevalier",
    lat: 14.4467,
    lng: -60.838,
    offshore: [230, 360],
    station: null,
  },
]

/** Reference station used to calibrate models when a spot has no working station of its own. */
export const REFERENCE_SPOT: SpotId = "faula"

export function getSpot(id: string | null | undefined): Spot {
  return SPOTS.find((s) => s.id === id) ?? SPOTS[0]
}
