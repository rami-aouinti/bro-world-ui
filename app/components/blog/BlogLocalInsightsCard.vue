<script setup lang="ts">
type LocalBriefingEvent = {
  title: string
  whyItMatters: string
}

type LocalBriefingTip = {
  title: string
  action: string
}

type LocalBriefingResponse = {
  source: 'ai' | 'fallback'
  generatedAt: string
  location: {
    city: string
    region: string
    country: string
    latitude: number | null
    longitude: number | null
  }
  weather: {
    temperatureC: number | null
    apparentTemperatureC: number | null
    windSpeedKmh: number | null
    weatherCode: number | null
    weatherLabel: string
  }
  headline: string
  summary: string
  events: LocalBriefingEvent[]
  tips: LocalBriefingTip[]
}

const isLoading = ref(false)
const isLocating = ref(false)
const errorMessage = ref('')
const briefing = ref<LocalBriefingResponse | null>(null)

const temperatureLabel = computed(() => {
  if (!briefing.value) {
    return ''
  }

  if (briefing.value.weather.temperatureC === null || briefing.value.weather.apparentTemperatureC === null) {
    return 'Weather not available'
  }

  const rounded = Math.round(briefing.value.weather.temperatureC)
  const apparent = Math.round(briefing.value.weather.apparentTemperatureC)
  return `${rounded}°C (ressenti ${apparent}°C)`
})

const locationLabel = computed(() => {
  if (!briefing.value) {
    return ''
  }

  const parts = [briefing.value.location.city, briefing.value.location.region, briefing.value.location.country]
    .filter(part => part && part.trim().length > 0)

  return parts.join(', ')
})

const loadBriefing = async (position?: GeolocationPosition) => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const payload = {
      latitude: position?.coords.latitude,
      longitude: position?.coords.longitude,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language || 'en-US',
    }

    briefing.value = await $fetch<LocalBriefingResponse>('/api/ai/local-briefing', {
      method: 'POST',
      body: payload,
    })
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'Cannot load data'
  }
  finally {
    isLoading.value = false
  }
}

const requestLocationBriefing = () => {
  if (!navigator.geolocation) {
    void loadBriefing()
    return
  }

  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      isLocating.value = false
      void loadBriefing(position)
    },
    () => {
      isLocating.value = false
      void loadBriefing()
    },
    {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 10 * 60 * 1000,
    },
  )
}

onMounted(async () => {
  await loadBriefing()
})
</script>

<template>
  <div class="d-flex align-center justify-space-between ga-2 mb-2">
    <p class="text-overline text-high-emphasis mb-0">IA Briefing</p>
    <v-chip v-if="briefing" size="x-small" :color="briefing.source === 'ai' ? 'primary' : 'warning'" variant="tonal">
      {{ briefing.source === 'ai' ? 'Vercel AI Gateway' : 'Mode fallback' }}
    </v-chip>
  </div>

  <v-skeleton-loader v-if="isLoading" type="list-item-two-line, list-item-three-line" />

  <v-alert v-else-if="errorMessage" type="warning" variant="tonal" density="comfortable">
    {{ errorMessage }}
  </v-alert>

  <template v-else-if="briefing">
    <h2 class="text-subtitle-1 font-weight-bold mb-1">{{ briefing.headline }}</h2>
    <p class="text-body-2 text-high-emphasis mb-3">{{ briefing.summary }}</p>

    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-chip size="small" color="primary" variant="tonal">{{ locationLabel }}</v-chip>
      <v-chip size="small" color="info" variant="tonal">{{ temperatureLabel }}</v-chip>
      <v-chip size="small" color="secondary" variant="tonal">{{ briefing.weather.weatherLabel }}</v-chip>
    </div>
    <v-btn
      size="small"
      variant="tonal"
      color="primary"
      class="mb-3"
      :loading="isLocating"
      prepend-icon="mdi-crosshairs-gps"
      @click="requestLocationBriefing"
    >
      Use my location
    </v-btn>

    <v-list density="comfortable" class="bg-transparent pa-0 mb-2">
      <v-list-subheader class="px-0 text-caption text-high-emphasis">Events</v-list-subheader>
      <v-list-item v-for="event in briefing.events" :key="event.title" class="px-0">
        <template #prepend>
          <v-icon size="18" icon="mdi-star-four-points-outline" class="me-2" />
        </template>
        <v-list-item-title class="text-body-2 font-weight-medium">{{ event.title }}</v-list-item-title>
        <v-list-item-subtitle class="text-caption text-high-emphasis">{{ event.whyItMatters }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </template>
</template>
