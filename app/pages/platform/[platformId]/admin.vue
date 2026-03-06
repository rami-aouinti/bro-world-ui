<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()

const platformId = computed(() => String(route.params.platformId ?? ''))
</script>

<template>
  <UiPageSection max-width="1200" card>
    <template #header>
      <UiSectionHeader
        title="Platform Admin"
        :subtitle="`Zone d'administration pour la platform ${platformId}`"
      />
    </template>

    <div class="d-flex flex-wrap ga-3">
      <v-chip color="primary" variant="tonal">Platform: {{ platformId }}</v-chip>
      <v-btn variant="outlined" :to="`/platform/${platformId}/home`">Retour Home</v-btn>
      <v-btn variant="text" to="/platform">Retour liste</v-btn>
    </div>
  </UiPageSection>
</template>
