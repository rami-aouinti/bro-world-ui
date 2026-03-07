<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const sessions = [
  { icon: 'mdi-desktop-classic', title: 'Bucharest 68.133.163.201', description: 'Your current session', badge: 'Active', city: 'EU' },
  { icon: 'mdi-desktop-classic', title: 'Chrome on macOS', description: '', city: 'US' },
  { icon: 'mdi-cellphone', title: 'Safari on iPhone', description: '', city: 'US' },
]
</script>

<template>
  <SettingsLayout>
    <UiCard rounded="lg">
      <h3 class="text-h5 font-weight-bold mb-1">Sessions</h3>
      <p class="text-body-1 text-medium-emphasis mb-6">
        This is a list of devices that have logged into your account. Remove those that you do not recognize.
      </p>

      <v-list>
        <template v-for="(session, index) in sessions" :key="session.title">
          <v-list-item :prepend-icon="session.icon" :title="session.title" :subtitle="session.description">
            <template #append>
              <div class="d-flex align-center ga-4">
                <v-chip v-if="session.badge" size="small" color="success" variant="tonal">{{ session.badge }}</v-chip>
                <span class="text-body-2 text-medium-emphasis">{{ session.city }}</span>
                <v-btn variant="text" color="primary">See More</v-btn>
              </div>
            </template>
          </v-list-item>
          <v-divider v-if="index < sessions.length - 1" class="my-2" />
        </template>
      </v-list>
    </UiCard>
  </SettingsLayout>
</template>
