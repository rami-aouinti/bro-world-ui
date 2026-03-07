<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const crmPath = (page: string) => `/platform/${slug.value}/crm/${page}`
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="CRM" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="crmPath('settings')">Settings</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('billing')">Billing</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Facturation" subtitle="Plans et historique de paiement" />
      <UiCard>
        <v-table>
          <thead><tr><th>Période</th><th>Plan</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            <tr><td>Mai 2026</td><td>CRM Pro</td><td>€149</td><td><v-chip size="x-small" color="success">Payé</v-chip></td></tr>
            <tr><td>Avr 2026</td><td>CRM Pro</td><td>€149</td><td><v-chip size="x-small" color="success">Payé</v-chip></td></tr>
            <tr><td>Mar 2026</td><td>CRM Pro</td><td>€149</td><td><v-chip size="x-small" color="warning">En attente</v-chip></td></tr>
          </tbody>
        </v-table>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
