<script setup lang="ts">
import { sessionRiskEvents } from '~/data/settings-demo'

definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()

onMounted(() => currentUser.fetchMe())
</script>

<template>
  <SettingsLayout>
    <v-card-text>
      <h3 class="text-h5 font-weight-bold mb-1">Sessions</h3>
      <p class="text-body-1 text-medium-emphasis mb-4">Devices connected to your account.</p>

      <v-list>
        <template v-for="(session, index) in currentUser.me?.sessions || []" :key="session.id || index">
          <v-list-item :prepend-icon="session.current ? 'mdi-monitor' : 'mdi-cellphone'" :title="session.userAgent || 'Unknown device'" :subtitle="session.ip || 'Unknown IP'">
            <template #append>
              <v-chip v-if="session.current" size="small" color="success" variant="tonal">Active</v-chip>
            </template>
          </v-list-item>
          <v-divider v-if="index < (currentUser.me?.sessions?.length || 0) - 1" class="my-2" />
        </template>
      </v-list>
    </v-card-text>
    <template #aside>
      <v-card-text>
        <h4 class="text-subtitle-1 font-weight-bold mb-3">Recent security events (fake data)</h4>
        <v-timeline density="compact" side="end" truncate-line="both">
          <v-timeline-item
              v-for="event in sessionRiskEvents"
              :key="event.event"
              size="small"
              :dot-color="event.severity === 'high' ? 'error' : 'success'"
          >
            <div class="d-flex align-center ga-2 mb-1">
              <div class="text-body-2 font-weight-medium">{{ event.event }}</div>
              <v-chip size="x-small" :color="event.severity === 'high' ? 'error' : 'success'" variant="tonal">
                {{ event.severity === 'high' ? 'High risk' : 'Informational' }}
              </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">{{ event.date }}</div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </template>
  </SettingsLayout>
</template>
