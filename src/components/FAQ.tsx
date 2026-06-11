"use client"

import { useState } from "react"

type Item = {
  id: string
  emoji: string
  title: string
  body: () => React.ReactNode
}

const T = {
  p: (s: string) => (
    <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 10 }}>{s}</p>
  ),
  ul: (items: string[]) => (
    <ul style={{ paddingLeft: 18, margin: "8px 0", display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: it }}
        />
      ))}
    </ul>
  ),
  h: (s: string) => (
    <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
      color: "var(--label)", marginBottom: 6, marginTop: 14 }}>{s}</p>
  ),
}

const ITEMS: Item[] = [
  {
    id: "sources",
    emoji: "🌊",
    title: "Quelles sources de données ?",
    body: () => (
      <div>
        {T.p("L'app agrège 5 modèles météo indépendants en parallèle :")}
        {T.ul([
          "<strong>GFS</strong> (NOAA, USA) — modèle global, 7 jours, très fiable pour les Caraïbes",
          "<strong>ICON</strong> (DWD, Allemagne) — excellent en zone tropicale, résolution fine",
          "<strong>ERA5</strong> (ECMWF) — réanalyse historique, données passées uniquement",
          "<strong>AROME</strong> (Météo-France) — modèle régional dédié Antilles-Caraïbes",
          "<strong>Yr.no</strong> (Met Norway) — service météo national norvégien, couverture mondiale",
        ])}
        {T.p("La balise live est une station anémométrique physique à la Pointe Faula (station Windguru #4164, gérée par Airfly972), qui mesure la vitesse et la direction du vent en temps réel.")}
        {T.p("Open-Meteo et Yr.no sont entièrement gratuits, sans clé API. Seule la balise nécessite l'intégration iframe Windguru.")}
      </div>
    ),
  },
  {
    id: "how",
    emoji: "⚙️",
    title: "Comment fonctionne l'agrégation ?",
    body: () => (
      <div>
        {T.p("À chaque requête, les appels API sont lancés en parallèle. Les données sont mises en cache 30 minutes côté serveur. Le client interroge l'API toutes les 30 minutes automatiquement.")}
        {T.h("Système d'étoiles")}
        {T.ul([
          "Calme — vent < 11 nœuds (insuffisant pour kiter)",
          "★ — 11 à 12 nœuds (praticable avec grande aile)",
          "★★ — 13 à 14 nœuds (session correcte)",
          "★★★ — ≥ 15 nœuds (session idéale Pointe Faula)",
        ])}
      </div>
    ),
  },
  {
    id: "pwa",
    emoji: "📱",
    title: "Installer l'app sur mobile",
    body: () => (
      <div>
        {T.p("Installer Mada Kite Forecast en tant qu'application sur ton téléphone te donne un accès rapide depuis l'écran d'accueil, sans passer par le navigateur. L'app s'ouvre en plein écran, sans barre d'URL.")}
        {T.h("Sur iPhone (Safari uniquement)")}
        {T.ul([
          "Ouvre l'app dans <strong>Safari</strong> (pas Chrome ni Firefox)",
          "Appuie sur l'icône <strong>Partager</strong> (carré avec flèche vers le haut) en bas de l'écran",
          "Fais défiler et appuie sur <strong>« Sur l'écran d'accueil »</strong>",
          "Confirme en appuyant sur <strong>« Ajouter »</strong> en haut à droite",
        ])}
        {T.h("Sur Android (Chrome)")}
        {T.ul([
          "Ouvre l'app dans <strong>Chrome</strong>",
          "Appuie sur le menu <strong>⋮</strong> (trois points) en haut à droite",
          "Appuie sur <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>",
          "Confirme l'installation",
        ])}
        {T.p("Une fois installée, l'icône kite apparaît sur ton écran d'accueil comme n'importe quelle appli native.")}
      </div>
    ),
  },
  {
    id: "tech",
    emoji: "🛠",
    title: "Stack technique",
    body: () => (
      <div>
        {T.p("L'app est open-source et déployée sur Vercel. Voici les technologies utilisées :")}
        {T.ul([
          "<strong>Next.js 15</strong> App Router — framework React fullstack, rendu serveur",
          "<strong>React 19</strong> + <strong>TypeScript</strong> — UI réactive et typée",
          "<strong>Tailwind CSS v4</strong> — utilitaires CSS, design tokens personnalisés",
          "<strong>Open-Meteo API</strong> — gratuite, sans clé API, modèles GFS/ICON/ERA5/AROME",
          "<strong>Yr.no API</strong> (Met Norway) — gratuite, sans clé API",
          "<strong>Vercel</strong> — déploiement, edge functions, CDN global",
        ])}
        {T.p("Le code source est disponible sur GitHub : github.com/abg5f/MadaKiteForecast")}
      </div>
    ),
  },
  {
    id: "dev",
    emoji: "👤",
    title: "Le développeur",
    body: () => (
      <div>
        {T.p("Mada Kite Forecast a été conçu et développé par Paul-Henri Dufourcq, kitesurfeur et développeur web basé en Martinique.")}
        {T.p("Le projet est né d'un besoin simple : avoir une source unique, lisible sur mobile, pour savoir si ça souffle à la Pointe Faula avant d'y aller. Les apps météo classiques ne donnent pas une lecture intuitive pour le kitesurf.")}
        {T.ul([
          "Instagram : <a href='https://www.instagram.com/poloduf_fishing/' target='_blank' rel='noopener' style='color:var(--brand);font-weight:600;text-decoration:none'>@poloduf_fishing</a>",
          "GitHub : <a href='https://github.com/abg5f' target='_blank' rel='noopener' style='color:var(--brand);font-weight:600;text-decoration:none'>github.com/abg5f</a>",
        ])}
      </div>
    ),
  },
  {
    id: "contact",
    emoji: "✉️",
    title: "Contact & partenariats",
    body: () => (
      <div>
        {T.p("Tu peux me contacter pour :")}
        {T.ul([
          "Signaler un bug ou suggérer une amélioration",
          "Proposer un partenariat (écoles de kite, spots, marques)",
          "Commander une app similaire pour ton spot ou ton activité",
        ])}
        <a
          href="mailto:contactfacile@pm.me"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginTop: 12,
            padding: "10px 20px", borderRadius: "var(--r-pill)",
            background: "var(--brand)", color: "#fff",
            fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}
        >
          ✉️ contactfacile@pm.me
        </a>
      </div>
    ),
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: "var(--text)",
        letterSpacing: "-0.01em", marginBottom: 14,
      }}>
        À propos &amp; FAQ
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: "var(--r-card)", overflow: "hidden", border: "1px solid var(--border)" }}>
        {ITEMS.map((item, idx) => {
          const isOpen = open === item.id
          const isLast = idx === ITEMS.length - 1
          return (
            <div key={item.id} style={{ background: "var(--card)" }}>
              <button
                onClick={() => setOpen(isOpen ? null : item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px",
                  background: "none", border: "none",
                  borderBottom: (!isOpen && !isLast) ? "1px solid var(--border-soft)" : "none",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{item.emoji}</span>
                <span style={{
                  flex: 1, fontSize: 14, fontWeight: 600,
                  color: "var(--text)", lineHeight: 1.3,
                }}>
                  {item.title}
                </span>
                <span style={{
                  fontSize: 12, color: "var(--muted-text)", flexShrink: 0,
                  transition: "transform .2s",
                  display: "inline-block",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}>▼</span>
              </button>

              {isOpen && (
                <div style={{
                  padding: "4px 16px 16px 46px",
                  borderBottom: !isLast ? "1px solid var(--border-soft)" : "none",
                }}>
                  {item.body()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
