# API-Football v3 mapping (Nuxt server routes)

Ce document centralise le mapping entre les routes internes Nuxt (`/api/fifa/*`) et les endpoints API-Football v3 (API-Sports) afin d'aligner front/composables/stores avec le proxy serveur.

## Source de vérité

Le mapping runtime est défini dans `server/api/fifa/_mapping.ts`.

## Table de mapping

| Route Nuxt interne | Endpoint API-Football v3 | Query params requis | Pagination |
| --- | --- | --- | --- |
| `/api/fifa/teams` | `/teams` | _aucun_ | non |
| `/api/fifa/standings` | `/standings` | `league`, `season` | non |
| `/api/fifa/fixtures` | `/fixtures` | `league`, `season` | non |
| `/api/fifa/players` | `/players` | `team`, `season` | oui (`page` propagé) |
| `/api/fifa/odds` | `/odds` | `fixture` | oui (`page` propagé) |
| `/api/fifa/stadiums` (legacy conservé) | `/venues` | _aucun_ | non |

## Règles de validation serveur

- Chaque route valide les query params requis **avant** de proxifier vers API-Football.
- Si un paramètre requis est manquant, l'API Nuxt renvoie une `400` avec le code `FIFA_PROXY_INVALID_QUERY`.
- Les paramètres métiers sont conservés tels quels (pas de transformation destructive) par le proxy, y compris `page` sur les endpoints paginés.

## Stratégie de cache proxy FIFA

- Les clés Redis FIFA sont construites via `buildCacheKey` avec une clé stable basée sur:
  - le profil de cache (`reference` ou `live`),
  - l'endpoint upstream normalisé,
  - le hash des query params.
- TTL **référence** (équipes, stades, etc.): `FOOTBALL_CACHE_TTL_SECONDS` (défaut `86400`).
- TTL **live** (fixtures, standings, players, odds): `FOOTBALL_LIVE_CACHE_TTL_SECONDS` (défaut `60`).
- Bypass manuel conservé:
  - header recommandé: `x-football-refresh: 1`,
  - header legacy toujours accepté: `x-fifa-refresh: 1`.

## Recommandations front/composables/stores

- Utiliser exclusivement les routes Nuxt listées ci-dessus (et non les endpoints API-Sports directement).
- Pour les pages `players` et `odds`, transmettre `page` côté composable/store pour piloter la pagination sans logique serveur additionnelle.
- Pour forcer un refresh depuis le front (sans attendre l'expiration TTL), envoyer `x-football-refresh: 1` (ou `x-fifa-refresh: 1` pour compatibilité legacy).
- En cas d'ajout d'une nouvelle route FIFA, mettre à jour **d'abord** `server/api/fifa/_mapping.ts`, puis ce document.
