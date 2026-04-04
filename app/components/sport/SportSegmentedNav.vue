<script setup lang="ts">
import { computed } from 'vue'
import { buildSportSectionRoute, type SportSection } from './sportContext'

const props = defineProps<{
  sportSlug: string
  activeSection: SportSection
}>()

const { t } = useI18n()

const tabs = computed(() => [
  {
    label: t('app.navigation.players'),
    section: 'players' as const,
  },
  {
    label: t('app.navigation.games'),
    section: 'games' as const,
  },
  {
    label: t('app.navigation.teams'),
    section: 'teams' as const,
  },
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
      class="text-none sport-segmented-nav__button"
      :data-testid="`sport-tab-${tab.section}`"
    >
      <span>{{ tab.label }}</span>
    </v-btn>
  </v-btn-toggle>
</template>

<style scoped>
.sport-segmented-nav {
  width: fit-content;
}

.sport-segmented-nav__button {
  opacity: 1;
}

.sport-segmented-nav__button.v-btn--disabled {
  opacity: 0.7;
}
</style>
