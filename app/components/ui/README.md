# UI Components (`app/components/ui`)

Ce dossier centralise les composants UI réutilisables de l'application.

## Arborescence

- `UiCard.vue`
- `UiAvatar.vue`
- `UiDataTable.vue`
- `state/*` pour les états d'interface (chargement, vide, alertes)
- `typography/*` (optionnel) pour les briques typographiques partagées

## Conventions de nommage

- Tous les composants partagés suivent le préfixe **`Ui*`**.
- Les noms sont orientés rôle visuel/fonctionnel (`UiCard`, `UiEmptyState`, `UiSectionHeader`, etc.).
- Les composants d'un sous-domaine sont regroupés en sous-dossier (`state`, `typography`).

## Principes props / slots

- **Props**: exposer une API simple et stable, avec des valeurs par défaut explicites.
- **Slots**: préférer les slots pour le contenu flexible (`header`, `actions`, `empty`, etc.).
- **Composants data-display** (ex: table): fournir des slots nommés pour personnaliser le rendu par cellule/état.

## Politique assets média

### Source

- Les médias critiques affichés sur les pages clé (cards produits, candidats, campus, etc.) doivent prioritairement être servis depuis des chemins locaux (`/public/images/...`) ou un CDN interne.
- Éviter les dépendances runtime à des sources externes non maîtrisées pour les contenus au-dessus de la ligne de flottaison.

### Format

- Utiliser un format optimisé selon le besoin visuel :
  - `webp`/`avif` pour des photos compressées,
  - `svg` pour des visuels illustratifs/placeholder.
- Éviter les formats lourds non compressés pour les grilles de cards.

### Dimensions & responsive

- Préparer un ratio stable (ex: 16:9) pour limiter les décalages de layout.
- Définir explicitement `loading="lazy"`, `decoding="async"` et `sizes` côté composant d'image.
- Fournir un `srcset` quand plusieurs rendus sont disponibles.

### Fallback

- Chaque média critique doit disposer d'un fallback local de secours (ex: `/images/placeholders/platform-media-fallback.svg`).
- Le composant UI doit gérer les erreurs de chargement (`@error`) et basculer automatiquement vers ce fallback.
- Afficher un état skeleton cohérent pendant le chargement (aligné avec les patterns `UiSkeletonCardGrid`).

## Exemples rapides

```vue
<UiCard title="Profil" subtitle="Informations utilisateur">
  <p class="text-body-2">Contenu principal</p>

  <template #actions>
    <v-btn color="primary">Sauvegarder</v-btn>
  </template>
</UiCard>
```

```vue
<UiAvatar name="Alice Martin" status="online" size="lg" />
```

```vue
<UiDataTable :headers="headers" :items="items" empty-text="Aucune donnée">
  <template #item.actions="{ item }">
    <v-btn size="small" variant="text">Voir {{ item.name }}</v-btn>
  </template>
</UiDataTable>
```
