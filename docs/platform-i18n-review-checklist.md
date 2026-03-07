# Platform i18n review checklist

- [ ] Tous les libellés visibles des pages `app/pages/platform/[slug]/...` utilisent des clés `platform.*` (pas de string hardcodée en template).
- [ ] Les labels de navigation (`platform.<domain>.nav.*`) sont fournis via i18n.
- [ ] Les titres/sous-titres/CTA des composants `PlatformSidebarNav.vue` et `PlatformHeroHeader.vue` utilisent des clés i18n.
- [ ] Les montants monétaires sont formatés via `Intl.NumberFormat` avec la locale active.
- [ ] Les dates/temps relatifs (ex: `2j`, `1w`) sont convertis en microcopy localisée.
- [ ] Les microcopies critiques (erreurs d’accès, CTA, titres de section) ont été relues au moins en FR et EN, puis validées pour ES/PT/DE/AR.
- [ ] `node scripts/validate-i18n.mjs` passe sans erreur.
