import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mada Kite Forecast",
    short_name: "Mada Kite",
    description: "Agrégateur météo des vents multi-sources en Martinique",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1F2A3A",
    theme_color: "#1F2A3A",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
