<script setup lang="ts">
import type { SportTeamItem } from './types'

const props = defineProps<{
  teams: SportTeamItem[]
  selectedTeamId: string | null
}>()

const emit = defineEmits<{
  select: [teamId: string]
}>()

const { t, te } = useI18n()
const label = (key: string, fallback: string) => (te(key) ? t(key) : fallback)
</script>

<template>
  <v-list class="py-0" lines="two" density="comfortable" nav>
    <v-list-item
      v-for="team in props.teams"
      :key="team.id"
      rounded="lg"
      :active="team.id === props.selectedTeamId"
      class="mb-2"
      @click="emit('select', team.id)"
    >
      <template #prepend>
        <v-avatar size="28" rounded="0" color="surface-variant">
          <v-img v-if="team.logo" :src="team.logo" :alt="team.name" cover />
          <v-icon v-else icon="mdi-shield-outline" />
        </v-avatar>
      </template>

      <template #title>
        <div class="d-flex align-center justify-space-between ga-2">
          <span>{{ team.name }}</span>
          <v-chip v-if="team.national" size="x-small" variant="outlined">{{ label('sport.labels.national', 'National') }}</v-chip>
        </div>
      </template>

      <template #subtitle>
        <div class="d-flex flex-wrap align-center ga-2 mt-1">
          <span>{{ team.country || label('sport.fallback.unknownCountry', 'Unknown country') }}</span>
          <template v-if="team.venue.name">
            <span>•</span>
            <span>{{ team.venue.name }}</span>
          </template>
          <template v-if="team.venue.city">
            <span>•</span>
            <span>{{ team.venue.city }}</span>
          </template>
        </div>
      </template>
    </v-list-item>
  </v-list>
</template>
