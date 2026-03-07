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
        <v-btn variant="outlined" block :to="crmPath('home')">Home</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('companies')">Companies</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('projects')">Projects</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Comptes & entreprises" subtitle="Suivi du portefeuille clients" />
      <UiCard>
        <v-table>
          <thead><tr><th>Entreprise</th><th>Secteur</th><th>CA annuel</th><th>Owner</th></tr></thead>
          <tbody>
            <tr><td>Novatek</td><td>Industrie</td><td>€1.2M</td><td>Rania</td></tr>
            <tr><td>Cloudware</td><td>SaaS</td><td>€860k</td><td>Paul</td></tr>
            <tr><td>Greenline</td><td>Énergie</td><td>€540k</td><td>Mehdi</td></tr>
          </tbody>
        </v-table>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
