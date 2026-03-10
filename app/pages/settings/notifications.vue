<script setup lang="ts">
import { notificationChannels } from '~/data/settings-demo'

definePageMeta({ public: false, requiresAuth: true })

type NotificationPreference = {
  switchState: boolean
  text: string
}

type NotificationPreferencesResponse = {
  configurationKey: string
  configurationValue: NotificationPreference[]
}

const { apiFetch } = useApiClient()
const isLoading = ref(true)
const isSavingMap = ref<Record<string, boolean>>({})
const preferences = ref<NotificationPreference[]>([])

const loadPreferences = async () => {
  isLoading.value = true

  try {
    const response = await apiFetch<NotificationPreferencesResponse>('/api/v1/profile/configuration/user.notifications.preferences', {
      method: 'GET',
    })

    preferences.value = response.configurationValue ?? []
  }
  finally {
    isLoading.value = false
  }
}

const updatePreference = async (item: NotificationPreference, value: boolean) => {
  const previousValue = item.switchState
  item.switchState = value
  isSavingMap.value[item.text] = true
  const updatedPreferences = preferences.value.map((preference) => {
    if (preference.text === item.text) {
      return {
        ...preference,
        switchState: value,
      }
    }

    return preference
  })

  try {
    const response = await apiFetch<NotificationPreferencesResponse>('/api/v1/profile/configuration/user.notifications.preferences', {
      method: 'PATCH',
      body: {
        configurationValue: updatedPreferences,
      },
    })

    await clearNuxtData('settings-notification-preferences')
    preferences.value = response.configurationValue ?? updatedPreferences
  }
  catch {
    item.switchState = previousValue
  }
  finally {
    isSavingMap.value[item.text] = false
  }
}

onMounted(loadPreferences)
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-1">Notifications</h3>
    <p class="text-body-1 text-medium-emphasis mb-4">Choose how you receive notifications.</p>

    <v-row class="mb-2">
      <v-col v-for="channel in notificationChannels" :key="channel.channel" cols="12" md="4">
        <v-sheet rounded="lg" color="surface-variant" class="pa-3">
          <p class="text-subtitle-2 mb-1">{{ channel.channel }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ channel.status }}</p>
        </v-sheet>
      </v-col>
    </v-row>

    <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />

    <v-table v-else>
      <thead>
      <tr>
        <th>Notification</th>
        <th class="text-right">Enabled</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in preferences" :key="item.text">
        <td class="font-weight-medium">{{ item.text }}</td>
        <td class="text-right">
          <v-switch
            :model-value="item.switchState"
            :loading="isSavingMap[item.text]"
            class="notification-switch"
            color="primary"
            hide-details
            @update:model-value="(value) => updatePreference(item, Boolean(value))"
          />
        </td>
      </tr>
      </tbody>
    </v-table>
  </SettingsLayout>
</template>

<style scoped>
.notification-switch :deep(.v-selection-control) {
  justify-content: flex-end;
}

.notification-switch :deep(.v-selection-control__wrapper) {
  margin-inline-start: 0;
}
</style>
