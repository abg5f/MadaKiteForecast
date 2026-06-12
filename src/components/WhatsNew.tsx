"use client"

import { useEffect, useState } from "react"

const VERSION_KEY = "mada-kite-v5"

const FEATURES = [
  { emoji: "🌊", text: "Vue Radar météo en temps réel (Windy) — pluie, vent, satellite, houle" },
  { emoji: "📍", text: "3 spots : Pointe Faula, Cap Est et Cap Chevalier — prévisions dédiées pour chaque spot" },
  { emoji: "📡", text: "Balises live : Airfly à Pointe Faula, Tempest WX à Cap Est" },
  { emoji: "⏱", text: "Scroll automatique sur l'heure courante (ou lendemain 07:00 après 20h)" },
  { emoji: "📱", text: "L'app est téléchargeable sur iPhone et Android — tuto dans le menu ☰ en haut à droite" },
]

export default function WhatsNew() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      setShow(!localStorage.getItem(VERSION_KEY))
    } catch {
      // ignore storage errors
    }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(VERSION_KEY, "1") } catch { /* noop */ }
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-card)",
      padding: "16px 16px 14px",
      marginBottom: 16,
      position: "relative",
      boxShadow: "0 2px 12px rgba(92,112,98,0.10)",
    }}>
      {/* Close */}
      <button
        onClick={dismiss}
        aria-label="Fermer"
        style={{
          position: "absolute", top: 12, right: 12,
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--surface)", border: "1px solid var(--border-soft)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--muted-text)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Titre */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: "color-mix(in srgb, var(--brand) 12%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17,
        }}>✨</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
            Quoi de neuf ?
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.3 }}>
            Nouvelles fonctionnalités disponibles
          </p>
        </div>
      </div>

      {/* Liste */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>{f.emoji}</span>
            <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
              {f.text}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={dismiss}
        style={{
          width: "100%", height: 40,
          borderRadius: "var(--r-pill)", border: "none",
          background: "var(--brand)", color: "#fff",
          fontSize: 14, fontWeight: 600,
          cursor: "pointer", letterSpacing: "0.01em",
        }}
      >
        Compris, merci !
      </button>
    </div>
  )
}
