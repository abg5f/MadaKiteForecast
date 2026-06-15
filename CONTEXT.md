# Context — Faula (MadaKiteForecast)

> Dernière mise à jour : 2026-06-15

## État actuel

- App Next.js 15 / React 19 / Tailwind v4 déployée sur Vercel — agrégateur de prévisions vent pour Pointe Faula, Martinique
- 4 modèles Open-Meteo (GFS, ICON, ERA5, AROME) + WeatherFlow CKS fonctionnels
- Onglet "CKS" dans FilterToggle → affiche les prévisions WeatherFlow `better_forecast` (station 122730, Cap Est)
- WeatherFlow inclus dans la moyenne multi-sources
- `.env.local` a `CKS_TOKEN` + `CKS_STATION_ID=122730` — **à ajouter manuellement dans Vercel** (pas committé)

## Décisions prises

- WeatherFlow intégré via `better_forecast` (prévisions), pas les observations live — les observations live n'ont pas de données vent (batterie faible de la balise physique)
- `ModelType` étendu avec `"WEATHERFLOW"` ; `OmModel = Exclude<ModelType, "WEATHERFLOW">` pour garder le typage strict d'`OM_MODELS`
- Données WeatherFlow stockées dans `openMeteo["WEATHERFLOW"]` (pragmatique — évite de créer un nouveau champ dans `AggregatedForecast`)
- Conversion m/s → nœuds : ×1.944

## En cours / TODOs

- Ajouter `CKS_TOKEN` et `CKS_STATION_ID` dans les variables d'environnement Vercel (step manuel non encore confirmé)
- Balise physique CKS hors ligne (anémomètre) : batterie à 2.18V, se rechargera au soleil — surveiller

## Problèmes connus

- Anémomètre Tempest ST-00127822 hors ligne (batterie basse 2.18V) — l'onglet CKS affiche quand même les prévisions WeatherFlow, mais pas de mesures in-situ
- Yr.no présent dans `AggregatedForecast` mais non exposé dans l'UI (champ `yr` inutilisé)

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/lib/api-clients.ts` | Types + fetch de toutes les sources (OpenMeteo, Yr, WeatherFlow) |
| `src/app/api/wind-forecast/route.ts` | Route API — Promise.allSettled sur 5 sources + moyenne |
| `src/components/FilterToggle.tsx` | Sélecteur de modèle (AROME/GFS/ICON/ERA5/CKS) |
| `src/components/WindForecast.tsx` | Composant principal : fetch, polling 15 min, rendu |
| `.env.local` | `CKS_TOKEN`, `CKS_STATION_ID`, `SPOT_LAT/LNG` — non committé |

---
_Mis à jour via `/save`. Lire ce fichier en début de session pour reprendre le contexte._
