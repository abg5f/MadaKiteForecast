export type SpotId = "faula" | "capest" | "chevalier"
export type StationType = "windguru" | "weatherflow" | null

export type Spot = {
  id: SpotId
  name: string
  lat: number
  lng: number
  stationLabel: string
  stationType: StationType
  // windguru only
  stationSrc?: string
  stationHeight?: number
}

export const SPOTS: Spot[] = [
  {
    id: "faula",
    name: "Pointe Faula",
    lat: 14.55,
    lng: -60.83,
    stationLabel: "Balise Live · Airfly",
    stationType: "windguru",
    stationSrc: "https://www.windguru.cz/wgs-iframe.php?s=4164&wj=knots&tj=c&tmprh=1&avg_min=0&date_format=Y-m-d%20H%3Ai%3As%20T",
    stationHeight: 68,
  },
  {
    id: "capest",
    name: "Cap Est",
    lat: 14.58859,
    lng: -60.84985,
    stationLabel: "Balise Live · Tempest WX",
    stationType: "weatherflow",
  },
  {
    id: "chevalier",
    name: "Cap Chevalier",
    lat: 14.4467,
    lng: -60.838,
    stationLabel: "Balise Live",
    stationType: null,
  },
]
