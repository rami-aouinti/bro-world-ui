<script setup lang="ts">
import EntityCard from '~/components/platform/cards/EntityCard.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import { crmCompanies } from '~/data/platform/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const crmPath = (page: string) => `/platform/${slug.value}/crm/${page}`
const loading = ref(true)

const companies = computed(() =>
  [...crmCompanies].sort((a, b) => b.annualRevenueEur - a.annualRevenueEur),
)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 200)
})
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
      <UiSkeletonCardGrid v-if="loading" :cards="4" />
      <v-row v-else>
        <v-col v-for="company in companies" :key="company.id" cols="12" md="6" lg="4">
          <EntityCard
            :title="company.name"
            :subtitle="`Owner ${company.owner} · CA ${company.annualRevenueEur.toLocaleString('fr-FR')} €`"
            :category="company.category"
            :status="company.status"
            :tags="company.tags"
            date-label="Créé"
            :date-value="company.createdAt"
          />
        </v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
