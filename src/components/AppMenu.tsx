"use client"

import { useState } from "react"

// ── helpers ───────────────────────────────────────────────────────────────────

const p = (text: string) => (
  <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 8 }}>{text}</p>
)

const ul = (items: string[]) => (
  <ul style={{ paddingLeft: 18, margin: "6px 0 10px", display: "flex", flexDirection: "column", gap: 5 }}>
    {items.map((it, i) => (
      <li key={i} style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: it }} />
    ))}
  </ul>
)

const h = (text: string) => (
  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
    color: "var(--label)", margin: "14px 0 5px" }}>{text}</p>
)

// ── FAQ items ─────────────────────────────────────────────────────────────────

type Item = {
  id: string; emoji: string; title: string; description: string
  body: () => React.ReactNode
}

const ITEMS: Item[] = [
  {
    id: "sources",
    emoji: "🌊",
    title: "Sources de données",
    description: "Open-Meteo, Yr.no, balise Airfly live",
    body: () => (
      <>
        {p("L'app agrège 5 modèles météo indépendants en parallèle :")}
        {ul([
          "<strong>GFS</strong> (NOAA, USA) — modèle global, 7 jours",
          "<strong>ICON</strong> (DWD, Allemagne) — très bon en zone tropicale",
          "<strong>ERA5</strong> (ECMWF) — réanalyse historique, passé uniquement",
          "<strong>AROME</strong> (Météo-France) — modèle régional Antilles-Caraïbes",
          "<strong>Yr.no</strong> (Met Norway) — couverture mondiale, gratuit",
        ])}
        {p("La balise live est une station anémométrique physique à la Pointe Faula (Windguru #4164, gérée par Airfly972), données en temps réel.")}
      </>
    ),
  },
  {
    id: "how",
    emoji: "⚙️",
    title: "Comment ça marche",
    description: "Agrégation, moyenne circulaire, étoiles",
    body: () => (
      <>
        {p("5 appels API lancés en parallèle. La vue « Moyenne » calcule :")}
        {ul([
          "<strong>Vitesse</strong> : moyenne arithmétique des modèles disponibles",
          "<strong>Direction</strong> : moyenne circulaire (vecteurs unitaires) — évite la discontinuité 359°/1°",
          "<strong>Rafales</strong> : moyenne des maximums",
        ])}
        {h("Système d'étoiles (Calendrier)")}
        {ul([
          "Aucune étoile — < 10 nœuds (insuffisant)",
          "★ — 10 à 12 nœuds (praticable, grande aile)",
          "★★ — 12 à 14 nœuds (session correcte)",
          "★★★ — ≥ 14 nœuds (session idéale Pointe Faula)",
        ])}
        {p("Les données sont mises en cache 30 min côté serveur. Le client se rafraîchit automatiquement toutes les 30 minutes.")}
      </>
    ),
  },
  {
    id: "pwa",
    emoji: "📱",
    title: "Installer sur mobile",
    description: "Accès rapide depuis l'écran d'accueil",
    body: () => (
      <>
        {p("Installe l'app sur ton téléphone pour un accès direct depuis l'écran d'accueil, sans passer par le navigateur. Plein écran, pas de barre d'URL.")}
        {h("Sur iPhone (Safari)")}
        {ul([
          "Ouvre l'app dans <strong>Safari</strong>",
          "Appuie sur l'icône <strong>Partager</strong> (carré + flèche) en bas",
          "Sélectionne <strong>« Sur l'écran d'accueil »</strong>",
          "Confirme en appuyant <strong>« Ajouter »</strong>",
        ])}
        {h("Sur Android (Chrome)")}
        {ul([
          "Ouvre l'app dans <strong>Chrome</strong>",
          "Menu <strong>⋮</strong> → <strong>« Ajouter à l'écran d'accueil »</strong>",
          "Confirme l'installation",
        ])}
      </>
    ),
  },
  {
    id: "tech",
    emoji: "🛠",
    title: "Stack technique",
    description: "Next.js 15 · React 19 · Vercel",
    body: () => (
      <>
        {ul([
          "<strong>Next.js 15</strong> App Router — framework React fullstack",
          "<strong>React 19</strong> + <strong>TypeScript</strong>",
          "<strong>Tailwind CSS v4</strong> — design tokens Mikaza",
          "<strong>Open-Meteo API</strong> — gratuite, sans clé",
          "<strong>Yr.no API</strong> (Met Norway) — gratuite, sans clé",
          "<strong>Vercel</strong> — déploiement, CDN global",
        ])}
        <a href="https://github.com/abg5f/MadaKiteForecast" target="_blank" rel="noopener"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
            color: "var(--brand)", fontWeight: 600, textDecoration: "none", marginTop: 4 }}>
          ↗ github.com/abg5f/MadaKiteForecast
        </a>
      </>
    ),
  },
  {
    id: "dev",
    emoji: "👤",
    title: "Le développeur",
    description: "Paul-Henri Dufourcq",
    body: () => (
      <>
        {p("Conçu et développé par Paul-Henri Dufourcq, kitesurfeur et développeur web basé en Martinique.")}
        {p("Le projet est né d'un besoin simple : avoir une source unique, lisible sur mobile, pour savoir si ça souffle à la Pointe Faula avant d'y aller.")}
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <a href="https://www.instagram.com/paulphotopeche/" target="_blank" rel="noopener"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: "var(--r-pill)", background: "var(--surface)", border: "1px solid var(--border)",
              fontSize: 13, color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
            📸 @paulphotopeche
          </a>
        </div>
      </>
    ),
  },
  {
    id: "contact",
    emoji: "✉️",
    title: "Contact & partenariats",
    description: "Bugs, idées, projets similaires",
    body: () => (
      <>
        {ul([
          "Signaler un bug ou suggérer une amélioration",
          "Proposer un partenariat (école de kite, spot, marque)",
          "Commander une app similaire pour ton activité",
        ])}
        <a href="mailto:contactfacile@pm.me"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14,
            padding: "11px 22px", borderRadius: "var(--r-pill)",
            background: "var(--brand)", color: "#fff",
            fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          ✉️ contactfacile@pm.me
        </a>
      </>
    ),
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppMenu() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)

  const close = () => { setSheetOpen(false); setExpanded(null) }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Burger button (dans le header) ── */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Menu"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 38, height: 38,
          borderRadius: "var(--r-sm)",
          border: "none",
          background: "rgba(255,255,255,0.15)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <line x1="0" y1="1"  x2="18" y2="1"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="0" y1="7"  x2="18" y2="7"  stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="0" y1="13" x2="18" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* ── Sheet ── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={close}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(15,20,17,0.65)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 40,
              animation: "fadeIn 0.22s ease-out",
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0,
              zIndex: 50,
              borderRadius: "28px 28px 0 0",
              backgroundColor: "var(--bg)",
              maxHeight: "88dvh",
              display: "flex", flexDirection: "column",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
              animation: "slideUp 0.32s cubic-bezier(0.32,0.72,0,1)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, backgroundColor: "var(--faint)" }} />
            </div>

            {/* Header fixe */}
            <div style={{ padding: "14px 24px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--muted-text)", margin: 0 }}>
                À propos
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text)",
                margin: "2px 0 0", lineHeight: 1.2 }}>
                Mada Kite Forecast
              </p>
            </div>

            {/* Contenu scrollable */}
            <div style={{ overflowY: "auto", flex: 1, padding: "10px 16px 24px" }}>
              {ITEMS.map((item, idx) => {
                const isOpen = expanded === item.id
                const isLast = idx === ITEMS.length - 1
                return (
                  <div key={item.id} style={{ marginBottom: isLast ? 0 : 4 }}>
                    {/* Row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : item.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 14px",
                        borderRadius: "var(--r-card)",
                        background: isOpen ? "color-mix(in srgb, var(--brand) 7%, transparent)" : "transparent",
                        border: `1.5px solid ${isOpen ? "color-mix(in srgb, var(--brand) 20%, transparent)" : "transparent"}`,
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      {/* Icon bubble */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        backgroundColor: isOpen ? "color-mix(in srgb, var(--brand) 12%, transparent)" : "var(--surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>
                        {item.emoji}
                      </div>

                      {/* Labels */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600,
                          color: isOpen ? "var(--brand)" : "var(--text)",
                          margin: 0, lineHeight: 1.2 }}>
                          {item.title}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--muted-text)", margin: "2px 0 0", lineHeight: 1.3 }}>
                          {item.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                        style={{ flexShrink: 0, opacity: isOpen ? 1 : 0.3,
                          transform: isOpen ? "rotate(90deg)" : "none",
                          transition: "transform .2s" }}>
                        <path d="M6.5 4.5L11.5 9L6.5 13.5"
                          stroke={isOpen ? "var(--brand)" : "var(--text)"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Expanded content */}
                    {isOpen && (
                      <div style={{
                        padding: "4px 14px 14px 76px",
                        borderRadius: "0 0 var(--r-card) var(--r-card)",
                      }}>
                        {item.body()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
