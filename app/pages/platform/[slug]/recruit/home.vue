<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformApplication(slug)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Recruit" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="`/platform/${slug}/recruit/home`">Jobs</v-btn>
        <v-btn v-if="isOwner" variant="outlined" block class="mt-2" :to="`/platform/${slug}/recruit/admin`">Admin</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Offres d'emploi" subtitle="Pipeline de recrutement" />
      <UiCard>
        <v-list lines="two">
          <v-list-item title="Frontend Engineer" subtitle="Paris · CDI" :to="`/platform/${slug}/recruit/job/frontend-engineer`" />
          <v-list-item title="Product Designer" subtitle="Remote · CDI" :to="`/platform/${slug}/recruit/job/product-designer`" />
          <v-list-item title="Data Analyst" subtitle="Lyon · Freelance" :to="`/platform/${slug}/recruit/job/data-analyst`" />
        </v-list>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
