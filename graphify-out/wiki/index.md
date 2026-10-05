# Graphe Mada Kite

> Généré le 2026-10-05

- Nœuds : 111
- Arêtes : 252
- Communautés : 8

## God nodes

- **ForecastApp.tsx** (file, degré 32) : `src/components/ForecastApp.tsx`
- **DayDetail.tsx** (file, degré 23) : `src/components/DayDetail.tsx`
- **forecast.ts** (file, degré 23) : `src/lib/wind/forecast.ts`
- **types.ts** (file, degré 20) : `src/lib/wind/types.ts`
- **days.ts** (file, degré 19) : `src/lib/wind/days.ts`
- **time.ts** (file, degré 18) : `src/lib/time.ts`
- **LiveStation.tsx** (file, degré 17) : `src/components/LiveStation.tsx`
- **scale.ts** (file, degré 17) : `src/lib/wind/scale.ts`
- **HourGrid.tsx** (file, degré 16) : `src/components/HourGrid.tsx`
- **ModelTable.tsx** (file, degré 16) : `src/components/ModelTable.tsx`
- **icons.tsx** (file, degré 14) : `src/components/icons.tsx`
- **spots.ts** (file, degré 12) : `src/lib/spots.ts`

## Communautés

- **src/app/a-propos** : 3 nœuds
- **src/app/api/forecast** : 3 nœuds
- **src/app/api/station** : 3 nœuds
- **src/app** : 24 nœuds
- **src/components** : 21 nœuds
- **src/lib** : 19 nœuds
- **src/lib/wind** : 32 nœuds
- **concepts** : 6 nœuds

## Concepts

- **Consensus calibré** : Moyenne pondérée de 7 modèles corrigés du biais local
- **Calibration balise** : Biais + facteur rafales par modèle vs balise Windguru #4164, heures 7-18
- **Balise en direct** : Windguru JSON (Faula) + Tempest (Cap Est, CKS_TOKEN), repli iframe
- **Mode Modèles (Windguru)** : Tableau 7 jours, modèles empilés sous le consensus
- **Vue Synthèse** : Créneau navigable, étoiles, aile conseillée, grille horaire
- **Échelle couleur vent** : Échelle OKLCH façon Windguru
