<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Shop" :subtitle="`Application ${slug}`" dense />
      <v-btn variant="outlined" block :to="`/platform/${slug}/shop/home`">Catalogue</v-btn>
    </template>

    <template #default>
      <UiSectionHeader title="Commandes" subtitle="Historique des achats" />
      <UiCard>
        <v-table>
          <thead><tr><th>ID</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            <tr><td>#ORD-1203</td><td>04/06</td><td>€89</td><td><v-chip size="x-small" color="success">Livrée</v-chip></td></tr>
            <tr><td>#ORD-1202</td><td>02/06</td><td>€149</td><td><v-chip size="x-small" color="info">Expédiée</v-chip></td></tr>
          </tbody>
        </v-table>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
