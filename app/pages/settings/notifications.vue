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

  try {
    await apiFetch('/api/v1/profile/configuration/user.notifications.preferences', {
      method: 'PATCH',
      body: {
        configurationValue: [
          {
            switchState: value,
            text: item.text,
          },
        ],
      },
    })
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
    <p class="text-body-1 text-medium-emphasis mb-6">Choose how you receive notifications.</p>

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
