# Context — Faula (Mada Kite Forecast)

> Dernière mise à jour : 2026-10-05

## État actuel

- **Refonte complète en prod** (commit `301fbac`, https://mada-kite-forecast.vercel.app), déployée automatiquement par Vercel à chaque push sur `main`
- Next.js 16 / React 19 / Tailwind v4, sans librairie de composants (shadcn, lucide, clsx retirés)
- Consensus de 7 modèles Open-Meteo (ECMWF IFS, AIFS, ARPEGE, ICON, UKMO, GFS, GEM) en une seule requête, calibré en direct sur la balise Windguru #4164 (Faula)
- Balise Faula lue en JSON natif (mesure actuelle + historique 12 h + courbe mesuré/prévu), avec repli sur l'iframe Windguru
- Deux vues : **Synthèse** (créneau navigable, étoiles, aile conseillée, profil, grille horaire) et **Modèles** (tableau façon Windguru, modèles empilés sous le consensus, 7 jours, pas de 3 h ou 1 h)
- Page `/a-propos` : méthode, modèles, échelle de couleurs, installation PWA, contact
- Préférences par appareil en localStorage : poids du rider (`mk-weight`) et vue (`mk-view`)
- _Historique :_ (2026-06) intégration WeatherFlow CKS `better_forecast` ; onglet CKS masqué ; Yr.no retiré

## Décisions prises

- ERA5 retiré (réanalyse, pas de prévision) ; « AROME » retiré car il pointait sur ARPEGE (AROME ne couvre pas les Antilles sur Open-Meteo)
- Calibration sur les heures 7-18 uniquement (le biais de nuit diffère) : biais additif réduit si peu de données (n/(n+8)), plafonné à ±6 nds, conservé à 60 % aux longues échéances
- Rafales recalées par un facteur multiplicatif par modèle (0,6 à 1,2) : les rafales des modèles étaient très surestimées dans l'alizé
- Poids d'un modèle = prior / (MAE² + 0,5) ; Cap Est et Chevalier utilisent la calibration de Faula à 50 % (« régionale »)
- Toutes les heures en secondes unix UTC ; la Martinique est à UTC-4 sans heure d'été (helpers dans `src/lib/time.ts`)
- Design : thème clair sable (lecture en plein soleil) + sombre automatique, polices Barlow / Barlow Condensed, accent orange « bouée », échelle de vent en OKLCH façon Windguru
- Balise du spot hors ligne ou absente → affichage automatique de la balise de Faula comme « la plus proche »

## En cours / TODOs

- **Ajouter `CKS_TOKEN` dans les variables d'environnement Vercel** : sans lui, la balise de Cap Est affiche « injoignable » (pas les droits via le MCP)
- Publication sur les stores envisagée : Android d'abord (TWA via PWABuilder + `/.well-known/assetlinks.json`, test fermé de 14 jours avec 12 testeurs), puis iOS via Capacitor avec notifications « ça souffle » et widget (indispensable pour passer la règle Apple 4.2)
- Avant une publication sur les stores : demander l'accord d'Airfly / Windguru pour l'usage des données de la balise
- Message de nouveautés pour les utilisateurs rédigé dans la session (non intégré à l'app)

## Problèmes connus

- La balise Faula passe par l'API interne non documentée de Windguru (`iapi.php`, Referer requis) : peut casser sans prévenir, d'où le repli iframe
- Anémomètre Tempest de Cap Est hors ligne depuis le 8 juillet 2026 (batterie 2,12 V)
- La clé `api_key` publique WeatherFlow est révoquée (401) : seul `CKS_TOKEN` fonctionne
- ARPEGE ne couvre que ~4 jours : moins de modèles en fin de semaine (signalé dans l'UI)
- `npm run dev` : le port 3000 peut rester occupé par une ancienne instance

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/lib/wind/forecast.ts` | Moteur : fetch multi-modèles, calibration, consensus |
| `src/lib/wind/stations.ts` | Clients balises Windguru et Tempest |
| `src/lib/wind/models.ts` | Registre des 7 modèles (ids Open-Meteo, poids a priori) |
| `src/lib/wind/days.ts` | Synthèse journée : créneau, étoiles, confiance, orage, vent de terre |
| `src/lib/wind/scale.ts` | Échelle de couleurs, navigabilité, taille d'aile, directions |
| `src/lib/spots.ts` | Spots, secteurs offshore, configuration des balises |
| `src/components/ForecastApp.tsx` | Racine client : spot, polling, vues |
| `src/components/ModelTable.tsx` | Vue Modèles façon Windguru |
| `src/components/LiveStation.tsx` | Balise en direct + courbe mesuré/prévu |
| `src/app/api/forecast/route.ts`, `src/app/api/station/route.ts` | Routes API |
| `src/app/a-propos/page.tsx` | Page Infos / méthode |

## Graphe de connaissances
> Mis à jour le 2026-10-05

God nodes (concepts centraux) : `ForecastApp.tsx`, `DayDetail.tsx`, `forecast.ts`, `types.ts`, `days.ts`
Communautés détectées : 8 (111 nœuds, 252 arêtes)
Pour explorer : `graphify query "<question>"` / `graphify explain "<concept>"`

---
_Mis à jour via `/save`. Lire ce fichier en début de session pour reprendre le contexte._
