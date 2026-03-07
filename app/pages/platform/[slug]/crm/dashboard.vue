<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const crmPath = (page: string) => `/platform/${slug.value}/crm/${page}`

const kpis = [
  { label: 'Pipeline', value: '€ 128k', trend: '+12%' },
  { label: 'Opportunités', value: '43', trend: '+5' },
  { label: 'Taux de conversion', value: '34%', trend: '+2.1%' },
]
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="CRM" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="crmPath('home')">Home</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('dashboard')">Dashboard</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('companies')">Companies</v-btn>
        <v-btn variant="text" block class="mt-2" to="/platform">Retour liste</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Dashboard CRM" subtitle="Performance commerciale du trimestre" />

      <v-row class="mb-2">
        <v-col v-for="item in kpis" :key="item.label" cols="12" md="4">
          <UiListCard>
            <p class="text-overline mb-1">{{ item.label }}</p>
            <p class="text-h5 font-weight-bold mb-1">{{ item.value }}</p>
            <v-chip size="small" color="success" variant="tonal">{{ item.trend }}</v-chip>
          </UiListCard>
        </v-col>
      </v-row>

      <UiCard title="Prochaines actions">
        <v-table density="comfortable">
          <thead>
            <tr><th>Compte</th><th>Responsable</th><th>Échéance</th><th>Statut</th></tr>
          </thead>
          <tbody>
            <tr><td>Northwind</td><td>Amina</td><td>12/06</td><td><v-chip size="x-small" color="warning">À relancer</v-chip></td></tr>
            <tr><td>BlueSoft</td><td>Lucas</td><td>14/06</td><td><v-chip size="x-small" color="info">Démo planifiée</v-chip></td></tr>
            <tr><td>Vertex</td><td>Sarah</td><td>19/06</td><td><v-chip size="x-small" color="success">Signature</v-chip></td></tr>
          </tbody>
        </v-table>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
