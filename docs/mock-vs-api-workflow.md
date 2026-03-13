# Workflow mock (`app/data/**`) vs API réelle

## Flag d'environnement

- `NUXT_PUBLIC_USE_MOCK_DATA=true` active explicitement le mode mock.
- `NUXT_PUBLIC_USE_MOCK_DATA=false` force le mode production/API réelle.
- Valeur par défaut:
  - `true` en développement (`NODE_ENV=development`),
  - `false` en production.

Le flag est exposé dans `runtimeConfig.public.useMockData`.

## Garde build/lint

- Commande: `pnpm guard:mock-imports`.
- Cette garde scanne `app/pages/**` et `app/composables/**`.
- Si `NUXT_PUBLIC_USE_MOCK_DATA=false`, tout import de modules mock (`~/data/platform-demo`, `~/data/platform-enhanced`, `~/data/settings-demo`, etc.) fait échouer la commande.
- Le script de build lance cette garde avant `nuxt build`.

## Recommandation de développement

1. Développer rapidement une UI en mode mock (`NUXT_PUBLIC_USE_MOCK_DATA=true`).
2. Basculer les pages/composables vers les APIs (`app/composables/api/*`) avant livraison.
3. Exécuter `NUXT_PUBLIC_USE_MOCK_DATA=false pnpm guard:mock-imports` en CI pour bloquer les régressions.
4. Construire l'application avec `pnpm build`.

## Tests

- Les tests unitaires ne doivent pas importer `app/data/**` runtime comme fixtures.
- Utiliser des fixtures dédiées sous `tests/fixtures/**`.
- Exemple ajouté: `tests/fixtures/mock-data-guard/**` pour valider les règles de garde.
