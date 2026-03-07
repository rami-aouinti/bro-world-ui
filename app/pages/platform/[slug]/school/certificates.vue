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
      <UiSectionHeader title="School" :subtitle="`Application ${slug}`" dense />
      <v-btn variant="outlined" block :to="`/platform/${slug}/school/home`">Classes</v-btn>
    </template>

    <template #default>
      <UiSectionHeader title="Certificats" subtitle="Export des diplômes et attestations" />
      <UiCard>
        <v-table>
          <thead><tr><th>Élève</th><th>Programme</th><th>Date</th><th>Document</th></tr></thead>
          <tbody>
            <tr><td>Emma Laurent</td><td>Data Fundamentals</td><td>28/05</td><td><v-btn size="small" variant="text">PDF</v-btn></td></tr>
            <tr><td>Noah Martin</td><td>UX Basics</td><td>31/05</td><td><v-btn size="small" variant="text">PDF</v-btn></td></tr>
          </tbody>
        </v-table>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
