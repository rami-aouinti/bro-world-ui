# API-Football v3 mapping (Nuxt server routes)

Ce document centralise le mapping entre les routes internes Nuxt (`/api/fifa/*`) et les endpoints API-Football v3 (API-Sports), avec une convention de routing **par domaine**.

## Convention de routing (canonique)

Les nouvelles intégrations doivent utiliser uniquement ces préfixes:

- `reference/`
- `fixtures/`
- `teams/`
- `players/`
- `odds/`
- `predictions/`

Les routes root historiques (`/api/fifa/<endpoint>`) et `stats/` sont conservées temporairement comme alias de compatibilité.

## Routes canoniques exposées

| Route interne | Endpoint upstream v3 | Paramètres requis | Pagination |
| --- | --- | --- | --- |
| `/api/fifa/reference/countries` | `/countries` | _aucun_ | non |
| `/api/fifa/reference/leagues` | `/leagues` | _aucun_ | non |
| `/api/fifa/reference/seasons` | `/leagues/seasons` | _aucun_ | non |
| `/api/fifa/reference/timezone` | `/timezone` | _aucun_ | non |
| `/api/fifa/reference/venues` | `/venues` | _aucun_ | non |
| `/api/fifa/fixtures` | `/fixtures` | _aucun_ | non |
| `/api/fifa/fixtures/events` | `/fixtures/events` | `fixture` | non |
| `/api/fifa/fixtures/headtohead` | `/fixtures/headtohead` | `h2h` | non |
| `/api/fifa/fixtures/lineups` | `/fixtures/lineups` | `fixture` | non |
| `/api/fifa/fixtures/players` | `/fixtures/players` | `fixture` | non |
| `/api/fifa/fixtures/statistics` | `/fixtures/statistics` | `fixture` | non |
| `/api/fifa/fixtures/standings` | `/standings` | `league`, `season` | non |
| `/api/fifa/teams` | `/teams` | _aucun_ | non |
| `/api/fifa/teams/statistics` | `/teams/statistics` | `league`, `season`, `team` | non |
| `/api/fifa/players` | `/players` | `season` + au moins un parmi `id`, `team`, `league`, `search` | oui (`page`) |
| `/api/fifa/players/squads` | `/players/squads` | `team` | non |
| `/api/fifa/players/coachs` | `/coachs` | au moins un parmi `id`, `team`, `search` | non |
| `/api/fifa/players/injuries` | `/injuries` | _aucun_ | non |
| `/api/fifa/players/sidelined` | `/sidelined` | au moins un parmi `player`, `coach` | non |
| `/api/fifa/players/transfers` | `/transfers` | au moins un parmi `player`, `team` | non |
| `/api/fifa/players/trophies` | `/trophies` | au moins un parmi `player`, `coach` | non |
| `/api/fifa/odds` | `/odds` | _aucun_ | oui (`page`) |
| `/api/fifa/odds/bets` | `/odds/bets` | _aucun_ | non |
| `/api/fifa/odds/bookmakers` | `/odds/bookmakers` | _aucun_ | non |
| `/api/fifa/odds/live` | `/odds/live` | _aucun_ | non |
| `/api/fifa/odds/live/bets` | `/odds/live/bets` | _aucun_ | non |
| `/api/fifa/predictions` | `/predictions` | `fixture` | non |

## Aliases legacy encore exposés (dépréciés)

| Route legacy | Route canonique à utiliser | Endpoint upstream v3 |
| --- | --- | --- |
| `/api/fifa/countries` | `/api/fifa/reference/countries` | `/countries` |
| `/api/fifa/leagues` | `/api/fifa/reference/leagues` | `/leagues` |
| `/api/fifa/leagues/seasons` | `/api/fifa/reference/seasons` | `/leagues/seasons` |
| `/api/fifa/timezone` | `/api/fifa/reference/timezone` | `/timezone` |
| `/api/fifa/stadiums` | `/api/fifa/reference/venues` | `/venues` |
| `/api/fifa/standings` | `/api/fifa/fixtures/standings` | `/standings` |
| `/api/fifa/coachs` | `/api/fifa/players/coachs` | `/coachs` |
| `/api/fifa/injuries` | `/api/fifa/players/injuries` | `/injuries` |
| `/api/fifa/sidelined` | `/api/fifa/players/sidelined` | `/sidelined` |
| `/api/fifa/transfers` | `/api/fifa/players/transfers` | `/transfers` |
| `/api/fifa/trophies` | `/api/fifa/players/trophies` | `/trophies` |
| `/api/fifa/stats/coachs` | `/api/fifa/players/coachs` | `/coachs` |
| `/api/fifa/stats/injuries` | `/api/fifa/players/injuries` | `/injuries` |
| `/api/fifa/stats/sidelined` | `/api/fifa/players/sidelined` | `/sidelined` |
| `/api/fifa/stats/standings` | `/api/fifa/fixtures/standings` | `/standings` |
| `/api/fifa/stats/teams-statistics` | `/api/fifa/teams/statistics` | `/teams/statistics` |
| `/api/fifa/stats/transfers` | `/api/fifa/players/transfers` | `/transfers` |
| `/api/fifa/stats/trophies` | `/api/fifa/players/trophies` | `/trophies` |

## Note de migration

- Les routes root legacy et `stats/*` ci-dessus sont **dépréciées**.
- Date cible de retrait: **2026-09-30**.
- Plan recommandé:
  1. migrer les appels front/composables/stores vers les routes canoniques;
  2. monitorer l'usage des aliases (logs/metrics) pendant une release cycle;
  3. supprimer les aliases à la date cible.

## Validation & cache

- La validation de query params est portée par chaque handler (`required` et/ou `atLeastOneOf`).
- Les endpoints paginés exposent `page` côté proxy pour `/players` et `/odds`.
- Le cache Redis FIFA repose sur:
  - profil `reference` vs `live`,
  - endpoint upstream normalisé,
  - hash des query params.
