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
