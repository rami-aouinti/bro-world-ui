<script setup lang="ts">
import { computed } from 'vue'
import type { MatchEvent } from './types'

type EventSide = 'home' | 'away' | 'unknown'

type TimelineEvent = {
  event: MatchEvent
  side: EventSide
}

const props = defineProps<{
  events: MatchEvent[]
  homeTeamId?: number | null
  awayTeamId?: number | null
  homeTeamName?: string | null
  awayTeamName?: string | null
}>()

const placeholder = '—'

const normalizeName = (value?: string | null) => String(value || '').trim().toLowerCase()

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

const resolveSide = (event: MatchEvent): EventSide => {
  const eventTeamId = event?.team?.id != null ? Number(event.team.id) : null
  const homeId = props.homeTeamId != null ? Number(props.homeTeamId) : null
  const awayId = props.awayTeamId != null ? Number(props.awayTeamId) : null

  if (eventTeamId != null) {
    if (homeId != null && eventTeamId === homeId) {
      return 'home'
    }
    if (awayId != null && eventTeamId === awayId) {
      return 'away'
    }
  }

  const eventTeamName = normalizeName(event?.team?.name)
  if (!eventTeamName) {
    return 'unknown'
  }

  const homeName = normalizeName(props.homeTeamName)
  const awayName = normalizeName(props.awayTeamName)

  if (homeName && eventTeamName === homeName) {
    return 'home'
  }
  if (awayName && eventTeamName === awayName) {
    return 'away'
  }

  return 'unknown'
}

const timelineEvents = computed(() => {
  return props.events.map((event) => ({
    event,
    side: resolveSide(event),
  })) as TimelineEvent[]
})

const primaryRows = computed(() => timelineEvents.value.filter(item => item.side !== 'unknown'))
const unknownRows = computed(() => timelineEvents.value.filter(item => item.side === 'unknown'))
</script>

<template>
  <div class="pa-3">
    <v-alert v-if="!props.events.length" type="info" variant="tonal" density="comfortable">
      Aucun événement disponible.
    </v-alert>

    <div v-else class="timeline-grid d-grid ga-3">
      <div
        v-for="(item, index) in primaryRows"
        :key="`${item.event?.time?.elapsed || index}-${item.event?.type || 'event'}-${item.side}`"
        class="timeline-row"
      >
        <div class="timeline-side timeline-side--home">
          <v-card
            v-if="item.side === 'home'"
            variant="outlined"
            class="timeline-event-card timeline-event-card--home"
          >
            <div class="d-flex flex-wrap align-center justify-end ga-2">
              <v-chip size="x-small" :color="badgeColor(item.event?.type)" label>
                {{ item.event?.type || placeholder }}
              </v-chip>
              <span>{{ item.event?.detail || placeholder }}</span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ item.event?.player?.name || placeholder }} · {{ item.event?.team?.name || placeholder }}
            </div>
          </v-card>
        </div>

        <div class="timeline-minute">
          <v-chip size="small" variant="outlined">{{ formatMinute(item.event) }}</v-chip>
        </div>

        <div class="timeline-side timeline-side--away">
          <v-card
            v-if="item.side === 'away'"
            variant="outlined"
            class="timeline-event-card timeline-event-card--away"
          >
            <div class="d-flex flex-wrap align-center ga-2">
              <v-chip size="x-small" :color="badgeColor(item.event?.type)" label>
                {{ item.event?.type || placeholder }}
              </v-chip>
              <span>{{ item.event?.detail || placeholder }}</span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ item.event?.player?.name || placeholder }} · {{ item.event?.team?.name || placeholder }}
            </div>
          </v-card>
        </div>
      </div>

      <v-card v-if="unknownRows.length" variant="tonal" color="secondary" class="pa-3">
        <div class="text-subtitle-2 mb-2">Autres</div>
        <div class="d-grid ga-2">
          <div
            v-for="(item, index) in unknownRows"
            :key="`${item.event?.time?.elapsed || index}-${item.event?.type || 'event'}-unknown`"
            class="timeline-unknown-row"
          >
            <v-chip size="small" variant="outlined">{{ formatMinute(item.event) }}</v-chip>
            <v-chip size="x-small" :color="badgeColor(item.event?.type)" label>
              {{ item.event?.type || placeholder }}
            </v-chip>
            <span>{{ item.event?.detail || placeholder }}</span>
            <span class="text-caption text-medium-emphasis">
              {{ item.event?.player?.name || placeholder }} · {{ item.event?.team?.name || placeholder }}
            </span>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.timeline-grid {
  width: 100%;
}

.timeline-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  align-items: center;
}

.timeline-side {
  min-height: 1px;
}

.timeline-event-card {
  padding: 10px 12px;
}

.timeline-event-card--home {
  text-align: right;
}

.timeline-event-card--away {
  text-align: left;
}

.timeline-minute {
  display: flex;
  justify-content: center;
}

.timeline-unknown-row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.timeline-unknown-row .text-caption {
  grid-column: 1 / -1;
}

@media (max-width: 760px) {
  .timeline-row {
    grid-template-columns: 1fr;
  }

  .timeline-minute {
    justify-content: flex-start;
  }

  .timeline-event-card--home,
  .timeline-event-card--away {
    text-align: left;
  }
}
</style>
