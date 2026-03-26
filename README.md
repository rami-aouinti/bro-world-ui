# Bro World UI

Interface Nuxt 4 de la plateforme Bro World (Vue 3 + Pinia + Vuetify + i18n + auth session côté serveur).

## Setup

Installer les dépendances:

```bash
npm install
```

## Environnement

Le chiffrement de session (`nuxt-auth-utils`) nécessite un secret:

- `NUXT_SESSION_PASSWORD`: secret long aléatoire (minimum 32 caractères en production).
- En local, un mot de passe de dev interne est utilisé si la variable n'est pas définie.

### Session security minimums

Au démarrage, l'application valide la configuration session/cookie et échoue si les minimums ne sont pas respectés:

- hors dev, `NUXT_SESSION_PASSWORD` est obligatoire et fort (>= 32 chars),
- `SESSION_TTL_SECONDS` par défaut à `604800` (7 jours),
- `SESSION_COOKIE_NAME` doit respecter `[A-Za-z0-9_-]`,
- `SESSION_COOKIE_SAME_SITE` doit être `strict`, `lax` ou `none`,
- `SESSION_COOKIE_SECURE` doit être explicitement `true|false`, et obligatoire à `true` hors dev (et avec `sameSite=none`).

## Scripts utiles

## Mock data vs API réelle

- Le flag `NUXT_PUBLIC_USE_MOCK_DATA` pilote explicitement le mode mock.
- `true` (par défaut en dev) autorise les imports de données de démo.
- `false` (par défaut en prod) active la garde `pnpm guard:mock-imports` qui bloque les imports mock dans `app/pages/**` et `app/composables/**`.
- Documentation détaillée: `docs/mock-vs-api-workflow.md`.
- Cartographie des usages courants: `docs/mock-data-usage.md`.

## Development Server

### Développement et build

```bash
npm run dev
npm run build
npm run preview
npm run generate
```

### Qualité, i18n, tests

```bash
npm run validate:i18n
npm run test
npm run test:unit
```

- `validate:i18n`: exécute `scripts/validate-i18n.mjs` et vérifie que toutes les locales ont les mêmes clés que `en.json`, que les namespaces requis existent (`about`, `contact`, `faq`, `home`) et que le fallback EN fonctionne.
- `test`: lance toute la suite Vitest (`vitest run`).
- `test:unit`: lance uniquement les tests unitaires dans `tests/unit`.

Scripts de test Node additionnels (hors `package.json`, utiles pour des régressions ciblées):

```bash
node --test scripts/inbox-conversation-preview.test.mjs
node --test scripts/private-cache-security.test.mjs
```

## Structure du projet

- `app/pages`: pages routées Nuxt (URL = arborescence des fichiers).
- `app/stores`: stores Pinia par domaine fonctionnel (auth, users, inbox, etc.).
- `app/composables`: logique réutilisable (auth, accès API, règles métier, hooks de pages).
- `app/types`: contrats TypeScript (notamment `types/api/*` pour les payloads backend).

## Conventions de nommage

- **Pages** (`app/pages`): noms de fichiers alignés sur les routes (`settings/index.vue`, `[slug].vue`, etc.).
- **Stores** (`app/stores`): fichiers en `camelCase`, export `useXxxStore` avec `defineStore`.
- **Composables** (`app/composables`): préfixe `use` (`useAuth.ts`, `useUsersApi.ts`), sous-dossiers par domaine (`api/`, `platform/`, `admin/`, `recruit/`).
- **Types** (`app/types`): types métier regroupés par domaine API et suffixes explicites (`*Payload`, `*Response`, etc.).
- **Clés i18n**: namespaces stables par domaine/page (`home.*`, `platform.shop.*`, `errors.auth.*`) et structure identique dans toutes les locales.

## Flux auth/session

1. `useAuth().initSession()` appelle `GET /api/auth/session` pour hydrater l'état client au chargement.
2. Les endpoints `POST /api/auth/login` et `POST /api/auth/register` délèguent l'auth au backend puis construisent la session applicative.
3. Le serveur stocke le contexte auth (profil, rôles, locale, expiration) dans un cookie de session signé/chiffré.
4. La source d'identité canonique est `GET /api/v1/users/me` pour:
   - validation de session,
   - chargement du profil auth,
   - alimentation des données de la page profile.
5. Les chemins parallèles de type `/api/v1/profile` sont interdits pour la logique d'auth principale (ils restent réservés aux usages métier non-auth).
6. `sessionStatus` est strictement défini comme `healthy | degraded | invalid`:
   - `healthy`: session valide confirmée côté backend,
   - `degraded`: backend temporairement indisponible (5xx/timeout), session locale conservée,
   - `invalid`: invalidation confirmée par un 401/403 backend.
7. Politique de logout/exploitation:
   - logout uniquement sur `invalid` issu d'un 401/403 backend confirmé,
   - en cas de 5xx backend, rester connecté en mode dégradé (ne pas casser la session).
8. `POST /api/auth/logout` efface le cookie de session et réinitialise l'état front.

## Stratégie i18n

- Module `@nuxtjs/i18n` avec:
  - locale par défaut/fallback: `en`,
  - stratégie `no_prefix` (URLs non préfixées),
  - lazy loading des fichiers JSON depuis `i18n/locales`.
- Le front résout la locale active depuis la session (ou profil), avec fallback contrôlé (`en`).
- Toute nouvelle clé doit être ajoutée dans **toutes** les locales et validée via `npm run validate:i18n`.

## How to add a new feature

Exemple de flow recommandé (page + store + API composable + i18n):

1. **Créer la page** dans `app/pages/...` (route Nuxt).
2. **Créer/étendre un store Pinia** dans `app/stores/...` pour l'état partagé (loading, data, erreurs).
3. **Créer un composable API** dans `app/composables/api/useXxxApi.ts` pour centraliser les appels HTTP.
4. **Brancher la page au store** (la page déclenche les actions du store, le store appelle le composable API).
5. **Ajouter les types** dans `app/types/api/...` (payloads/réponses) avant d'écrire la logique.
6. **Ajouter les clés i18n** dans `i18n/locales/en.json` puis répliquer dans les autres locales.
7. **Couvrir par des tests** (`tests/unit` et/ou tests de composables), puis lancer validation i18n et tests.

## PR checklist

Avant d'ouvrir une PR:

- [ ] **Typing**: nouveaux flux et payloads typés, pas de `any` évitable.
- [ ] **i18n**: tous les textes visibles passent par i18n, clés présentes dans toutes les locales.
- [ ] **Error handling**: erreurs API gérées (états d'erreur UX + cas de fallback).
- [ ] **Performance**: imports lourds en lazy/dynamic import, pas de régression bundle évidente.
- [ ] **Validation locale**: `npm run test`, `npm run test:unit`, `npm run validate:i18n` exécutés.

## Performance budgets (CI)

Le pipeline CI applique des budgets de performance à chaque Pull Request et sur `main`.

### Budgets définis

- **JS initial**: `<= 300 KiB` (somme des bundles JS produits dans `.output/public/_nuxt`).
- **CSS initial**: `<= 120 KiB` (somme des bundles CSS produits dans `.output/public/_nuxt`).
- **LCP** (Largest Contentful Paint): `<= 2500 ms`.
- **TBT** (Total Blocking Time): `<= 200 ms`.

Les seuils sont centralisés dans `perf/bundle-budgets.json` (JS/CSS) et `perf/lighthouserc.json` (LCP/TBT).

### Règles de revue

- Les **imports dynamiques sont obligatoires pour les bibliothèques lourdes** (exemples: `echarts`, `xlsx`, `jspdf`, `@fullcalendar/*`) afin de limiter le coût du chargement initial.
- Toute nouvelle dépendance volumineuse doit être chargée à la demande (`import('...')`) au plus proche de l'usage.

### Vérifications locales

```bash
npm run build
npm run perf:bundle
npm run perf:lighthouse
```

### Rapport par PR

Le workflow GitHub Actions publie automatiquement un commentaire "Bundle diff" sur chaque PR avec:

- taille JS initiale (base vs PR),
- taille CSS initiale (base vs PR),
- delta par métrique.

## Stratégie cache (par endpoint)

Le proxy backend `server/api/backend/[...path].ts` applique une stratégie de cache Redis orientée ressources, avec invalidation active sur mutations.

### Endpoints couverts

- **Profile** (`/api/v1/profile`, `/api/v1/users/me`)
  - TTL: **3 minutes**.
  - Invalidation sur `PATCH|PUT` profile/users.
- **Notifications** (`/api/v1/notifications`)
  - TTL: **30 secondes**.
  - Invalidation sur `POST|PATCH|PUT|DELETE`.
- **Conversations** (`/api/v1/chat/private/conversations`)
  - TTL: **2 minutes**.
  - Invalidation sur `POST|PATCH|PUT|DELETE`.
- **Posts** (`/api/v1/private/blogs`, `/api/v1/blogs`, `/api/v1/private/stories`, `/api/v1/blog/*`)
  - TTL: **10 minutes**.
  - Invalidation sur mutations + purge des tags publics `blog:*`.
- **Events** (`/api/v1/events`)
  - TTL: **15 minutes**.
  - Invalidation sur `POST|PATCH|PUT|DELETE`.

### Observabilité cache

- Endpoint admin: `GET /api/admin/cache/stats`
  - expose **hit rate / miss rate**, **latence Redis moyenne** (read/write/invalidate), **compteurs d'invalidation**, et alertes actives.
- Logs corrélés:
  - `requestId` propagé via `x-session-correlation-id`.
  - événements `cache_hit`, `cache_miss`, `backend_fetch` pour comparer rapidement les chemins de lecture.
- Alerting:
  - alerte `*.hit_rate_drop` si le taux de hit passe sous le seuil configuré en runtime.
  - alerte `redis.unavailable` si lecture/écriture cache échoue.

## Observabilité (télémétrie front)

- Les événements structurés restent collectés via `useTracker()` en dev **et** en prod.
- Les logs console de télémétrie sont activés automatiquement en dev (`import.meta.dev`).
- En production, vous pouvez réactiver ces logs avec `NUXT_PUBLIC_DEBUG_TELEMETRY=true` (ou `1`, `yes`, `on`).
- Les warnings critiques restent visibles même sans flag de debug.
