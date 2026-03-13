# Audit hydratation marketing

## 1) Composants purement visuels identifiés (`app/components/ui/**`)

Composants sans `defineEmits`, sans écoute d'événement et utilisés surtout pour structure/présentation:

- `app/components/ui/UiCard.vue`
- `app/components/ui/UiListCard.vue`
- `app/components/ui/UiPageSection.vue`
- `app/components/ui/UiSectionHeader.vue`
- `app/components/ui/UiStatChip.vue`
- `app/components/ui/typography/UiTextCaption.vue`
- `app/components/ui/state/UiDefaultPageSkeleton.vue`
- `app/components/ui/state/UiDashboardPageSkeleton.vue`
- `app/components/ui/state/UiSkeletonCardGrid.vue`
- `app/components/ui/state/UiSkeletonDashboard.vue`
- `app/components/ui/state/UiSkeletonDataTable.vue`
- `app/components/ui/state/UiSkeletonForm.vue`

## 2) Blocs marketing candidats au rendu non hydraté

- Home (`app/pages/index.vue`): features, metrics, steps, final CTA.
- About (`app/pages/about.vue`): timeline, metrics et cartes mission (hors boutons CTA).
- Contact (`app/pages/contact.vue`): bloc availability/channels.
- FAQ (`app/pages/faq.vue`): hero statique (hors recherche/filtres/panels).

## 3) Changements réalisés

- Extraction des sections secondaires de la home vers un composant serveur `HomeSecondarySections.server.vue`.
- Migration de la home vers `useAsyncData` pour supprimer le `onMounted + watch` client.
- Chargement différé du widget CTA secondaire de contact via composant lazy-hydrated (`LazyContactSecondaryCta hydrate-on-visible`).

## 4) Mesure de baisse de JS exécuté au premier chargement

Métrique proxy utilisée: octets de `<script setup>` exécutables côté client sur pages marketing.

Commande:

```bash
node - <<'NODE'
const {execSync}=require('child_process');
const fs=require('fs');
const pages=['app/pages/index.vue','app/pages/contact.vue','app/pages/about.vue','app/pages/faq.vue'];
function scriptBytes(content){const m=content.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);return m?Buffer.byteLength(m[1],'utf8'):0}
for(const p of pages){
  const before=execSync(`git show HEAD:${p}`,{encoding:'utf8'});
  const after=fs.readFileSync(p,'utf8');
  const b=scriptBytes(before), a=scriptBytes(after);
  console.log(`${p}: ${b} -> ${a} (${a-b})`)
}
NODE
```

Résultat:

- `app/pages/index.vue`: `3214 -> 527` (**-2687 octets**, ~**-84%**).
- autres pages marketing: inchangé sur ce lot.

> Note: la build prod complète n'a pas pu être utilisée comme métrique bundle à cause d'un import cassé préexistant (`app/components/ui/overlay/UiActionDialog.vue` manquant).
