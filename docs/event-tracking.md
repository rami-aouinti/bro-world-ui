# Schéma d'événements de tracking

Ce document définit les événements métier et techniques à conserver stables.

## Contexte commun

Chaque événement doit inclure:

- `name`: nom canonique de l'événement.
- `timestamp`: date ISO.
- `context.routePath`: route courante.
- `context.userIdHash`: identifiant utilisateur anonymisé (`u_<hash>`), sans PII.
- `context.source`: `client` ou `server`.

## Événements métier clés

| Événement | Déclencheur | Payload minimum |
| --- | --- | --- |
| `auth.login.succeeded` | Connexion réussie | `method` |
| `auth.login.failed` | Échec de connexion | `method`, `reason` (si connu) |
| `recruit.application.created` | Candidature / application créée | `createdCount`, `platformId`, `hasPhoto` |
| `crm.entity.created` | Création d'entité CRM | `applicationSlug`, `entityType`, `entityId` |
| `crm.companies.loaded` | Chargement des sociétés CRM | `applicationSlug`, `count` |

## Événements techniques

| Événement | Déclencheur | Payload |
| --- | --- | --- |
| `api.latency` | Appel API critique terminé | `name`, `durationMs`, `method`, `status` |
| `api.request.failed` | Erreur HTTP/API | `path`, `method`, `error` |
| `error.vue.global` | Erreur globale Vue (`errorHandler`) | `info`, `component`, `error` |
| `error.vue.hook` | Hook Nuxt `vue:error` | `info`, `component`, `error` |
| `error.nuxt.app` | Hook Nuxt `app:error` | `error` |
| `error.server.global` | Erreur serveur Nitro (console) | `routePath`, `userIdHash`, `message`, `stack` |

## Règles anti-dérive

1. Ne pas renommer un `name` existant sans migration dashboard/alerting.
2. Ajouter les nouveaux événements dans ce document avant implémentation.
3. Ne jamais injecter de PII brute dans `payload` ou `context`.
4. Préférer des enums (`entityType`, `status`) aux valeurs libres.
