# Sport i18n review checklist

- [ ] Toute nouvelle string UI visible dans `app/pages/sport/**` et `app/components/sport/**` passe via `t('sport.*')` (ou autre namespace i18n existant).
- [ ] Aucun fallback lisible utilisateur n'est hardcodé dans les composants/pages sport (ex: `Unknown team`, `Loading...`, `Aucune équipe...`).
- [ ] Les états UX sport (`loading`, `empty`, `error`, `retry`) utilisent des clés i18n.
- [ ] Les labels de navigation/panneaux/onglets sport utilisent des clés i18n.
- [ ] Exécuter `node scripts/lint-sport-i18n.mjs` avant merge.
