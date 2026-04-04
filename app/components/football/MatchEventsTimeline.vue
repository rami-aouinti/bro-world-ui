<script setup lang="ts">
import type { MatchEvent } from './types'

const props = defineProps<{
  events: MatchEvent[]
}>()

const placeholder = '—'

const formatMinute = (event: MatchEvent) => {
  const elapsed = event?.time?.elapsed
  const extra = event?.time?.extra

  if (elapsed == null) {
    return placeholder
  }

  return extra ? `${elapsed}+${extra}'` : `${elapsed}'`
}

const badgeColor = (type?: string | null) => {
  const key = String(type || '').toLowerCase()

  if (key.includes('card')) {
    return 'warning'
  }
  if (key.includes('goal')) {
    return 'success'
  }
  if (key.includes('subst')) {
    return 'info'
  }

  return 'secondary'
}
</script>

<template>
    <div class="pa-3">
      <v-alert v-if="!props.events.length" type="info" variant="tonal" density="comfortable">
        Aucun événement disponible.
      </v-alert>
      <v-list v-else density="comfortable" class="py-0 bg-transparent">
        <v-list-item v-for="(event, index) in props.events" :key="`${event?.time?.elapsed || index}-${event?.type || 'event'}`" class="px-1">
          <template #prepend>
            <v-chip size="small" variant="outlined" class="mr-2">{{ formatMinute(event) }}</v-chip>
          </template>

          <v-list-item-title class="d-flex flex-wrap align-center ga-2">
            <v-chip size="x-small" :color="badgeColor(event?.type)" label>
              {{ event?.type || placeholder }}
            </v-chip>
            <span>{{ event?.detail || placeholder }}</span>
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ event?.player?.name || placeholder }} · {{ event?.team?.name || placeholder }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </div>
</template>
