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
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="`/platform/${slug}/school/home`">Classes</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="`/platform/${slug}/school/settings`">Settings</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="`/platform/${slug}/school/certificates`">Certificates</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Paramètres école" subtitle="Configuration académique" />
      <UiCard>
        <v-text-field label="Nom de l'établissement" value="Bro Academy" />
        <v-select label="Année scolaire" :items="['2025-2026', '2026-2027']" class="mt-2" />
        <v-switch label="Activer notifications parents" class="mt-2" color="primary" />
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
