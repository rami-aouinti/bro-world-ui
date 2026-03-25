<script setup lang="ts">
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
const { initSession, authState } = useAuth()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()
const isLoading = ref(true)
const isSavingMap = ref<Record<string, boolean>>({})
const preferences = ref<NotificationPreference[]>([])
const errorMessage = ref('')
const toastMessage = ref('')
const showToast = ref(false)
const toastColor = ref<'warning' | 'info'>('info')

const loadPreferences = async () => {
  isLoading.value = true

  try {
    await initSession()

    const canCallPrivateEndpoint = authState.value === 'authenticated' || authState.value === 'degraded'
    if (!canCallPrivateEndpoint) {
      preferences.value = []
      return
    }
    const response = await apiFetch<NotificationPreferencesResponse>('/api/v1/profile/configuration/user.notifications.preferences', {
      method: 'GET',
    })

    preferences.value = response.configurationValue ?? []
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'settings.notifications',
      action: 'load',
      fallbackKey: 'settings.notifications.errors.load',
    })
    $errorLogger(error, { area: 'settings.notifications', action: 'load', status: normalized.status })
    errorMessage.value = normalized.message
  }
  finally {
    isLoading.value = false
  }
}

const updatePreference = async (item: NotificationPreference, value: boolean) => {
  const previousValue = item.switchState
  errorMessage.value = ''
  toastMessage.value = ''
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
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'settings.notifications',
      action: 'update',
      fallbackKey: 'settings.notifications.errors.update',
    })
    $errorLogger(error, { area: 'settings.notifications', action: 'update', status: normalized.status })
    item.switchState = previousValue
    if (normalized.displayMode === 'alert') {
      errorMessage.value = normalized.message
    }
    else {
      toastColor.value = normalized.severity === 'warning' ? 'warning' : 'info'
      toastMessage.value = normalized.message
      showToast.value = true
    }
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

    <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
      {{ errorMessage }}
    </v-alert>

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
    <v-snackbar v-model="showToast" :timeout="2400" :color="toastColor" location="bottom right">
      {{ toastMessage }}
    </v-snackbar>
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
