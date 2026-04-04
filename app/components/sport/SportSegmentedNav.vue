<script setup lang="ts">
import { computed } from 'vue'
import { buildSportSectionRoute, type SportSection } from './sportContext'

const props = defineProps<{
  sportSlug: string
  activeSection: SportSection
}>()

const tabs = computed(() => [
  { label: 'Players', section: 'players' as const },
  { label: 'Games', section: 'games' as const },
  { label: 'Teams', section: 'teams' as const },
])
</script>

<template>
  <v-btn-toggle
    :model-value="activeSection"
    mandatory
    rounded="pill"
    color="primary"
    variant="outlined"
    class="sport-segmented-nav"
  >
    <v-btn
      v-for="tab in tabs"
      :key="tab.section"
      :value="tab.section"
      :to="buildSportSectionRoute(sportSlug, tab.section)"
      variant="text"
      class="text-none"
    >
      {{ tab.label }}
    </v-btn>
  </v-btn-toggle>
</template>

<style scoped>
.sport-segmented-nav {
  width: fit-content;
}
</style>
