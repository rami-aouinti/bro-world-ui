# Cache invalidation matrix

## Ressources et TTL

| Ressource | TTL | Déclencheur d'invalidation |
| --- | --- | --- |
| `profile` | 3 minutes (court) | update profile (`PATCH`/`PUT` sur `/api/v1/profile*` ou `/api/v1/users/me*`) |
| `conversation` | 2 minutes (court) | nouveau message (`POST` sur `/api/v1/chat/private/conversations*`) |
| `notifications` | 30 secondes (très court) | read/create/update/delete (`POST`/`PATCH`/`PUT`/`DELETE` sur `/api/v1/notifications*`) |
| `events` | 15 minutes (moyen) | event CRUD (`POST`/`PATCH`/`PUT`/`DELETE` sur `/api/v1/events*`) |
| `blog` (private/public) | 10 minutes | publish/update/delete (`POST`/`PATCH`/`PUT`/`DELETE` sur `/api/v1/blogs*`) |

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
