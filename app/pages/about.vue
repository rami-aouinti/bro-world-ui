<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()

const valueItems = [
  {
    key: 'impact',
    icon: 'mdi-rocket-launch-outline',
  },
  {
    key: 'trust',
    icon: 'mdi-shield-check-outline',
  },
  {
    key: 'innovation',
    icon: 'mdi-lightbulb-on-outline',
  },
]

const keyNumbers = [
  { key: 'users', icon: 'mdi-account-group-outline' },
  { key: 'uptime', icon: 'mdi-server-network' },
  { key: 'csat', icon: 'mdi-star-circle-outline' },
]

const testimonials = [
  { key: 'ops', icon: 'mdi-briefcase-outline' },
  { key: 'community', icon: 'mdi-forum-outline' },
]
</script>

<template>
  <UiPageSection max-width="1100">
    <v-fade-transition appear>
      <v-card class="pa-6 pa-md-8 mb-6 transition-elevation" elevation="4" rounded="xl" hover>
        <v-chip color="primary" class="mb-4" variant="tonal">
          {{ t('about.hero.badge') }}
        </v-chip>

        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ t('about.hero.title') }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">{{ t('about.hero.subtitle') }}</p>

        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary" size="large">{{ t('about.hero.primaryCta') }}</v-btn>
          <v-btn variant="outlined" size="large">{{ t('about.hero.secondaryCta') }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>

    <v-row class="mb-4" dense>
      <v-col cols="12" md="6">
        <v-card class="pa-5 h-100 transition-elevation" rounded="xl" hover>
          <h2 class="text-h6 mb-2">{{ t('about.blocks.mission.title') }}</h2>
          <p class="text-body-2 text-medium-emphasis">{{ t('about.blocks.mission.description') }}</p>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-5 h-100 transition-elevation" rounded="xl" hover>
          <h2 class="text-h6 mb-2">{{ t('about.blocks.vision.title') }}</h2>
          <p class="text-body-2 text-medium-emphasis">{{ t('about.blocks.vision.description') }}</p>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="pa-5 mb-6" rounded="xl" variant="tonal">
      <h2 class="text-h6 mb-4">{{ t('about.blocks.values.title') }}</h2>
      <v-row dense>
        <v-col v-for="item in valueItems" :key="item.key" cols="12" sm="4">
          <v-card class="pa-4 h-100 transition-elevation" rounded="lg" hover>
            <v-icon :icon="item.icon" color="primary" class="mb-2" />
            <h3 class="text-subtitle-1 font-weight-medium mb-1">{{ t(`about.blocks.values.items.${item.key}.title`) }}</h3>
            <p class="text-body-2 text-medium-emphasis">{{ t(`about.blocks.values.items.${item.key}.description`) }}</p>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="pa-5 mb-6" rounded="xl">
      <h2 class="text-h6 mb-4">{{ t('about.blocks.keyNumbers.title') }}</h2>
      <v-row dense>
        <v-col v-for="number in keyNumbers" :key="number.key" cols="12" sm="4">
          <div class="d-flex align-center ga-3 px-2 py-3 rounded-lg stat-item">
            <v-icon :icon="number.icon" color="primary" />
            <div>
              <div class="text-h6 font-weight-bold">{{ t(`about.blocks.keyNumbers.items.${number.key}.value`) }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ t(`about.blocks.keyNumbers.items.${number.key}.label`) }}</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-expand-transition>
      <v-card class="pa-5" rounded="xl" variant="outlined">
        <h2 class="text-h6 mb-4">{{ t('about.blocks.testimonials.title') }}</h2>
        <v-timeline density="compact" side="end" truncate-line="both">
          <v-timeline-item
            v-for="entry in testimonials"
            :key="entry.key"
            :dot-icon="entry.icon"
            fill-dot
            size="small"
          >
            <v-card class="pa-4 transition-elevation" rounded="lg" hover>
              <p class="text-body-2 mb-2">{{ t(`about.blocks.testimonials.items.${entry.key}.quote`) }}</p>
              <p class="text-caption text-medium-emphasis">{{ t(`about.blocks.testimonials.items.${entry.key}.author`) }}</p>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-card>
    </v-expand-transition>
  </UiPageSection>
</template>

<style scoped>
.stat-item {
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}
</style>
