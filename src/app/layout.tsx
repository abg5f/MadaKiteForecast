import type { Metadata, Viewport } from "next"
import { Barlow, Barlow_Condensed } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
})

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
})

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"

const description =
  "Prévisions vent kitesurf pour la Pointe Faula, Cap Est et Cap Chevalier (Martinique). Consensus de 7 modèles calibré en direct sur la balise, vent mesuré en temps réel."

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Mada Kite · Vent Pointe Faula, Martinique",
  description,
  openGraph: {
    title: "Mada Kite · Vent Pointe Faula",
    description,
    url: baseUrl,
    siteName: "Mada Kite Forecast",
    locale: "fr_FR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Mada Kite · Vent Pointe Faula", description },
  icons: { icon: "/favicon.svg", apple: "/apple-icon" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mada Kite" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ea" },
    { media: "(prefers-color-scheme: dark)", color: "#141a24" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
