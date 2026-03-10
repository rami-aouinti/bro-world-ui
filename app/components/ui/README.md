# UI Components (`app/components/ui`)

Ce dossier centralise les composants UI réutilisables de l'application.

## `UiCard` variants (`kind`)

- `default` : carte standard pour formulaires, tableaux et sections neutres.
- `glass` : surface translucide (header/app bar, CTA, blocs premium).
- `interactive` : cartes cliquables/liste avec hover/focus renforcé.
- `metric` : indicateurs/KPI avec accent visuel léger.
- `hero` : bloc de mise en avant (landing, intro de page, contenu prioritaire).

## États visuels standards (`UiCard`)

- `loading` : bloque l'interaction et affiche l'état de chargement Vuetify.
- `selected` : met en avant une carte active/sélectionnée.
- `error` : style de bordure/anneau pour état invalide/erreur.
- `success` : style de validation positive.
- `disabled` : carte atténuée et non interactive.

## Layout partagé (`UiPageSection` / `UiPageShell`)

- `spacing`: `compact` | `comfortable` | `spacious`
- `surface`: même gamme que `UiCard.kind` (`default`, `glass`, `interactive`, `metric`, `hero`)
- `elevationPreset`: `none` | `soft` | `raised`

Ces props évitent de répéter du CSS local sur chaque page pour les paddings/surfaces/ombres.

## Exemples rapides

```vue
<UiCard kind="interactive" :selected="isActive" title="Candidat">
  <p class="text-body-2">Profil synthétique</p>
</UiCard>
```

```vue
<UiPageShell
  title="Dashboard"
  subtitle="Vue consolidée"
  surface="glass"
  spacing="comfortable"
  elevation-preset="soft"
/>
```
