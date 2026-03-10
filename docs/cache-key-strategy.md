# Cache key strategy

Le projet utilise un format de clé Redis unique pour tous les accès cache applicatifs.

## Format canonique

```txt
{env}:{app}:{version}:{scope}:{resource}:{identifier}:{queryHash}
```

Exemples :

- `prod:bro-ui:v1:public:blog:list:9f3ab42f0a1cd890`
- `prod:bro-ui:v1:private:user:alice.notifications.list:3ab1de45c678f012`

## Segments

- `env` : environnement (`dev`, `staging`, `prod`).
- `app` : nom applicatif global (`bro-ui`).
- `version` : version de schéma cache (`v1`).
- `scope` : portée cache (`public`, `private`, `system`).
- `resource` : domaine logique (ex: `blogs`, `chat`, `notifications`).
- `identifier` : ressource fine (ex: `list`, `private.conversations`, `me.token-<hash>`).
- `queryHash` : hash SHA-256 tronqué (16 chars) des paramètres de requête triés; `noquery` si aucun query param.

## Source de vérité

Tous les accès cache doivent passer par `server/utils/cacheKeyBuilder.ts` :

- génération de clé: `buildCacheKey(...)`
- génération de pattern de scan/invalidation: `buildCacheScanPattern(...)`
- mapping chemin API → `resource`/`identifier`: `toPathResourceIdentifier(...)`

## Configuration

La stratégie est configurable via `runtimeConfig` :

- `cacheEnv` (fallback: `CACHE_ENV`, `NODE_ENV`, `dev`)
- `cacheApp` (fallback: `CACHE_APP`, `bro-ui`)
- `cacheVersion` (fallback: `CACHE_VERSION`, `v1`)

Cette convention permet de versionner les clés pour des migrations de schéma cache sans collisions inter-environnements.
