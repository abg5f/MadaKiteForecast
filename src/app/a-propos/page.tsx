import type { Metadata } from "next"
import Link from "next/link"
import { Icon, KiteMark } from "@/components/icons"
import { MODELS } from "@/lib/wind/models"
import { windColor } from "@/lib/wind/scale"

export const metadata: Metadata = {
  title: "Infos et méthode · Mada Kite",
  description: "Comment Mada Kite calcule ses prévisions de vent pour la Pointe Faula : 7 modèles, calibration sur la balise, indice de confiance.",
}

const SCALE = [
  { kts: 8, label: "Moins de 11", text: "Trop léger, sauf foil" },
  { kts: 12, label: "11 à 13", text: "Léger, grande aile" },
  { kts: 17, label: "14 à 24", text: "Navigable" },
  { kts: 27, label: "25 à 30", text: "Fort, petite aile" },
  { kts: 34, label: "31 et plus", text: "Très fort, prudence" },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-6 border-t border-line pt-6">
      <h2 id={`${id}-t`} className="text-xl font-bold text-ink">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-ink-2">{children}</div>
    </section>
  )
}

export default function About() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16">
      <header className="flex items-center justify-between gap-3 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="-ml-2 flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink-2 transition-colors duration-150 hover:bg-surface-2"
        >
          <Icon name="back" size={18} /> Prévisions
        </Link>
        <KiteMark size={26} className="text-ink" />
      </header>

      <h1 className="text-3xl font-bold leading-tight text-ink">Comment ça marche</h1>
      <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-ink-2">
        Mada Kite répond à une seule question : est-ce que ça souffle assez à la Pointe Faula pour sortir l&apos;aile, et quand ?
      </p>

      <div className="mt-8 space-y-8">
        <Section id="methode" title="Un consensus calibré, pas un seul modèle">
          <p>
            Chaque modèle météo a ses forces et ses biais. Plutôt que d&apos;en choisir un, l&apos;app en combine sept, puis les corrige avec le vent
            réellement mesuré par la balise de Faula.
          </p>
          <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-ink-3">
            <li>
              <strong className="text-ink">Comparaison avec la balise.</strong> Sur les 48 dernières heures (heures de navigation, 7h à 18h), chaque modèle est
              comparé au vent mesuré. On calcule son biais : par exemple, la plupart des modèles sous-estiment l&apos;alizé de 1 à 3 nœuds à Faula.
            </li>
            <li>
              <strong className="text-ink">Correction.</strong> Ce biais est retiré de chaque modèle, pleinement pour les prochaines heures, puis
              progressivement atténué sur les jours suivants. Les rafales sont recalées de la même façon.
            </li>
            <li>
              <strong className="text-ink">Pondération.</strong> Les modèles qui ont été les plus justes récemment pèsent plus lourd. Le classement
              change donc d&apos;un jour à l&apos;autre selon la situation météo.
            </li>
            <li>
              <strong className="text-ink">Indice de confiance.</strong> L&apos;écart entre les modèles donne la fiabilité : vert quand ils sont
              d&apos;accord (moins de 2 nœuds d&apos;écart), orange, puis rouge quand ils divergent. Le bouton « Comparer les modèles » montre le détail.
            </li>
          </ol>
          <p>
            Pour Cap Est et Cap Chevalier, sans balise fiable sur place, la calibration de Faula est appliquée à moitié : le biais régional existe, mais
            l&apos;exposition locale diffère.
          </p>
        </Section>

        <Section id="modeles" title="Les modèles utilisés">
          <ul className="divide-y divide-line-soft rounded-2xl bg-surface shadow-card">
            {MODELS.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-3 px-4 py-3">
                <span className="font-semibold text-ink">{m.label}</span>
                <span className="text-right text-sm text-ink-3">
                  {m.org} · {m.horizonDays} jours
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-3">
            AROME (Météo-France) ne couvre pas les Antilles dans les données ouvertes : Météo-France est représenté par ARPEGE. La réanalyse ERA5,
            utilisée auparavant, a été retirée car elle ne fait pas de prévision.
          </p>
        </Section>

        <Section id="echelle" title="Lire les couleurs">
          <p>Les couleurs reprennent l&apos;échelle familière des kiteurs : plus c&apos;est vert-jaune, plus c&apos;est bon. Valeurs en nœuds.</p>
          <ul className="space-y-2">
            {SCALE.map((s) => {
              const c = windColor(s.kts)
              return (
                <li key={s.label} className="flex items-center gap-3">
                  <span className="num flex h-9 w-24 shrink-0 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: c.bg, color: c.fg }}>
                    {s.label}
                  </span>
                  <span>{s.text}</span>
                </li>
              )
            })}
          </ul>
          <p>
            Les étoiles résument la journée : une pour au moins deux heures au-dessus de 12 nœuds, deux pour trois heures au-dessus de 14, trois pour quatre
            heures bien établies autour de 17 et plus. La taille d&apos;aile suit la règle 2,2 × poids ÷ vent, pour une twin-tip.
          </p>
        </Section>

        <Section id="balises" title="Les balises en direct">
          <p>
            <strong className="text-ink">Pointe Faula</strong> : balise Airfly (Windguru #4164), vent moyen, molles et rafales toutes les quelques minutes.
            Le graphique compare les 12 dernières heures mesurées à la prévision.
          </p>
          <p>
            <strong className="text-ink">Cap Est</strong> : balise CKS (Tempest #122730). Quand elle est hors ligne, l&apos;app affiche la balise de Faula,
            la plus proche.
          </p>
        </Section>

        <Section id="installer" title="Installer l'app sur ton téléphone">
          <p>
            <strong className="text-ink">iPhone</strong> : ouvre le site dans Safari, touche Partager, puis « Sur l&apos;écran d&apos;accueil ».
          </p>
          <p>
            <strong className="text-ink">Android</strong> : dans Chrome, menu ⋮ puis « Installer l&apos;application ».
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>Un bug, une idée, un spot à ajouter, un partenariat avec une école ? Écris-moi.</p>
          <div className="flex flex-wrap gap-2">
            <a href="mailto:contactfacile@pm.me" className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-bg">
              contactfacile@pm.me
            </a>
            <a
              href="https://www.instagram.com/paulphotopeche/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink"
            >
              Instagram @paulphotopeche
            </a>
          </div>
          <p className="text-sm text-ink-3">
            Conçu par Paul-Henri Dufourcq, kitesurfeur en Martinique. Les prévisions restent des prévisions : vérifie toujours les conditions sur place.
          </p>
        </Section>
      </div>
    </div>
  )
}
