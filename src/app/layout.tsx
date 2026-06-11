import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Mada Kite Forecast — Prévisions kitesurf Martinique",
  description:
    "Agrégateur météo des vents multi-sources en Martinique. Prévisions Open-Meteo & Yr.no pour la Pointe Faula, vue calendrier avec étoiles, balise live.",
  openGraph: {
    title: "Mada Kite Forecast 🪁",
    description:
      "Prévisions vent · Pointe Faula, Martinique. Étoiles par jour, balise live, plusieurs modèles météo.",
    url: baseUrl,
    siteName: "Mada Kite Forecast",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mada Kite Forecast 🪁",
    description:
      "Prévisions vent pour les kitesurfeurs de la Pointe Faula, Martinique.",
  },
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
