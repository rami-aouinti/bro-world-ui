# Cache invalidation matrix

## Ressources et TTL

| Ressource | TTL | Déclencheur d'invalidation |
| --- | --- | --- |
| `profile` | 3 minutes (court) | update profile (`PATCH`/`PUT` sur `/api/v1/profile*` ou `/api/v1/users/me*`) |
| `conversation` | 2 minutes (court) | nouveau message (`POST` sur `/api/v1/chat/private/conversations*`) |
| `notifications` | 30 secondes (très court) | read/create/update/delete (`POST`/`PATCH`/`PUT`/`DELETE` sur `/api/v1/notifications*`) |
| `events` | 15 minutes (moyen) | event CRUD (`POST`/`PATCH`/`PUT`/`DELETE` sur `/api/v1/events*`) |
| `blog` (private/public) | 10 minutes | publish/update/delete (`POST`/`PATCH`/`PUT`/`DELETE` sur `/api/v1/blogs*`) |

## API-Football: TTL, quotas et refresh forcé

### TTL recommandés par type de données

- **Référentiels** (pays, ligues, équipes, stades, saisons): **24h**  
  Données peu volatiles, impact quota élevé si refetch trop fréquent.
- **Standings / fixtures non-live**: **1h** (ou valeur produit explicitement retenue)  
  Compromis fraîcheur/coût acceptable hors fenêtre live.
- **Live / events / odds live**: **15 à 60 secondes**  
  TTL court pour limiter la latence perçue en match tout en protégeant le quota.

### Paramètres de configuration

- `FOOTBALL_CACHE_TTL_SECONDS`  
  TTL par défaut pour les endpoints non-live API-Football (ex: standings, fixtures pré-match, référence si non surchargée).
- `FOOTBALL_LIVE_CACHE_TTL_SECONDS`  
  TTL spécifique live (match en cours, événements live, cotes live), attendu entre **15s** et **60s** selon la sensibilité écran.

### Refresh forcé (bypass cache)

Les mécanismes suivants doivent être explicitement supportés/documentés pour forcer un refetch API-Football :

- Header **`x-football-refresh: 1`** (mécanisme principal).
- Header legacy **`x-fifa-refresh: 1`** (compatibilité descendante).
- Côté actions/store: option **`force=true`** pour propager l’intention de bypass cache.

### Matrice endpoint -> TTL -> justification produit/quota

| Endpoint API-Football (type) | TTL recommandé | Justification produit / quota |
| --- | --- | --- |
| `reference/*` (pays, ligues, équipes, stades, saisons) | 24h | Données stables ; minimiser les appels répétitifs coûteux en quota. |
| `standings` (hors live) | 1h | Le classement évolue peu hors fenêtre live ; 1h évite un refresh agressif sans impact UX majeur. |
| `fixtures` (pré-match / non-live) | 1h | Suffisant pour pages calendrier/pré-match ; réduit la pression sur quota en navigation répétée. |
| `fixtures/live` | 15–60s | Rafraîchissement quasi temps réel attendu par l’utilisateur pendant match. |
| `events/live` | 15–30s | Les événements (buts/cartons/remplacements) sont critiques UX ; TTL très court. |
| `odds/live` | 30–60s | Variations fréquentes mais pas nécessairement seconde par seconde ; compromis coût/pertinence. |

## Mapping événements métier -> clés invalidées

- `profile.update`
  - Prefix invalidation: `/api/v1/profile*`, `/api/v1/users/me*`
- `conversation.new_message`
  - Prefix invalidation: `/api/v1/chat/private/conversations*`
- `notifications.read_or_create`
  - Prefix invalidation: `/api/v1/notifications*`
- `events.crud`
  - Prefix invalidation: `/api/v1/events*`
- `blog.publish_or_update_or_delete`
  - Prefix invalidation: `/api/v1/blogs*`
  - Public tag invalidation: `blog:*`

## Observabilité

- Compteurs Redis (`system/cache/metrics`) alimentés pour:
  - `hit`
  - `miss`
  - `invalidate`
- Logs structurés applicatifs: `console.info('[cache.metric]', { resource, metric, detail })`

## Vérification staging (runbook)

1. Déployer la branche sur staging.
2. Générer de la charge nominale sur profile/conversation/notifications/events/blog.
3. Vérifier les compteurs Redis `cache metrics` par ressource (`*.hit`, `*.miss`, `*.invalidate`).
4. Calculer le hit ratio par ressource: `hit / (hit + miss)`.
5. Contrôler la fraîcheur:
   - exécuter une mutation,
   - relire immédiatement la ressource,
   - vérifier l'absence de stale read (donnée fraîche attendue).
