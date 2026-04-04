<script setup lang="ts">
import { computed } from 'vue'
import { getSportContext, type SportSection } from './sportContext'

const props = defineProps<{
  section: SportSection
}>()

const route = useRoute()
const { t, te } = useI18n()

const sportSlug = computed(() => String(route.params.sport ?? 'sport'))
const sport = computed(() => getSportContext(sportSlug.value, t, te))

const showWorldCupCta = computed(() => props.section === 'overview' && sport.value.slug === 'football')

const sectionCopy = computed(() => {
  if (props.section === 'players') {
    return t('sport.sectionCopy.players')
  }

  if (props.section === 'games') {
    return t('sport.sectionCopy.games')
  }

  if (props.section === 'teams') {
    return t('sport.sectionCopy.teams')
  }

  return t('sport.sectionCopy.overview')
})
</script>

<template>
  <UiPageShell :title="sport.label" :description="t('app.navigation.sport')">
    <div class="d-flex flex-column ga-4 ga-md-6">
      <SportHeaderCard
        :sport-name="sport.label"
        :sport-icon="sport.icon"
        :metrics="sport.metrics"
      />

      <SportSegmentedNav
        :sport-slug="sport.slug"
        :active-section="section"
      />

      <v-card variant="tonal" class="pa-4 pa-md-5">
        <p class="text-body-1 mb-3">
          {{ sectionCopy }}
        </p>

        <v-btn
          v-if="showWorldCupCta"
          to="/sport/football/world-cup"
          color="primary"
          variant="flat"
          prepend-icon="mdi-trophy-outline"
        >
          {{ t('sport.worldCup') }}
        </v-btn>
      </v-card>
    </div>
  </UiPageShell>
</template>
