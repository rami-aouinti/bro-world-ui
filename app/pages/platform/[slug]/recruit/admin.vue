<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()

const slug = computed(() => String(route.params.slug ?? ''))

const homePath = computed(() => `/platform/${slug.value}/recruit/home`)
const adminPath = computed(() => `/platform/${slug.value}/recruit/admin`)
const { isOwner } = usePlatformApplication(slug)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="Recruit"
        :subtitle="`Application ${slug}`"
      />

      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="homePath">Home</v-btn>
      <v-btn v-if="isOwner" variant="outlined" block :to="adminPath" class="mt-2">Admin</v-btn>
      <v-btn variant="text" block class="mt-2" to="/platform">Retour liste</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader
        title="Platform Recruit Admin"
        :subtitle="`Zone d'administration pour l'application ${slug} sur Recruit`"
      />

    <div class="d-flex flex-wrap ga-3">
      <v-chip color="primary" variant="tonal">Application: {{ slug }}</v-chip>
      <v-btn variant="outlined" :to="homePath">Retour Home</v-btn>
      <v-btn variant="text" to="/platform">Retour liste</v-btn>
    </div>
    </template>
  </PlatformSplitLayout>
</template>
