# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Environment Variables

Session encryption for `nuxt-auth-utils` requires a password.

- Set `NUXT_SESSION_PASSWORD` to a long random secret (minimum 32 characters) in production.
- In local development, this project falls back to an internal dev-only password if `NUXT_SESSION_PASSWORD` is not set.

### Session security minimums

At boot, the app validates session/cookie settings and refuses to start when minimum requirements are not met:

- Outside development, `NUXT_SESSION_PASSWORD` must be present and strong (>= 32 chars).
- `SESSION_TTL_SECONDS` defaults to `604800` (7 days) to reduce session exposure if a token leaks.
- `SESSION_COOKIE_NAME` must only contain letters, numbers, `_` or `-`.
- `SESSION_COOKIE_SAME_SITE` must be one of `strict`, `lax`, or `none`.
- `SESSION_COOKIE_SECURE` must be explicitly `true`/`false`, and must be `true` outside development (also mandatory when `sameSite=none`).


## Mock data vs API réelle

- Le flag `NUXT_PUBLIC_USE_MOCK_DATA` pilote explicitement le mode mock.
- `true` (par défaut en dev) autorise les imports de données de démo.
- `false` (par défaut en prod) active la garde `pnpm guard:mock-imports` qui bloque les imports mock dans `app/pages/**` et `app/composables/**`.
- Documentation détaillée: `docs/mock-vs-api-workflow.md`.
- Cartographie des usages courants: `docs/mock-data-usage.md`.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

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
