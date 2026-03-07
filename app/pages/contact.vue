<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()

const channels = [
  { key: 'email', icon: 'mdi-email-outline' },
  { key: 'phone', icon: 'mdi-phone-outline' },
  { key: 'chat', icon: 'mdi-message-processing-outline' },
]

const serviceTimeline = [
  { key: 'request', icon: 'mdi-message-badge-outline', color: 'primary' },
  { key: 'response', icon: 'mdi-timer-sand', color: 'warning' },
  { key: 'resolution', icon: 'mdi-check-decagram-outline', color: 'success' },
]
</script>

<template>
  <UiPageSection max-width="1100">
    <v-fade-transition appear>
      <v-card class="pa-6 pa-md-8 mb-6 transition-elevation" elevation="4" rounded="xl" hover>
        <v-chip color="primary" variant="tonal" class="mb-4">{{ t('contact.hero.badge') }}</v-chip>
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ t('contact.hero.title') }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">{{ t('contact.hero.subtitle') }}</p>

        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary">{{ t('contact.hero.primaryCta') }}</v-btn>
          <v-btn variant="outlined">{{ t('contact.hero.secondaryCta') }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>

    <v-row dense>
      <v-col cols="12" md="5">
        <v-card class="pa-5 mb-4 transition-elevation" rounded="xl" hover>
          <h2 class="text-h6 mb-4">{{ t('contact.channels.title') }}</h2>
          <v-list lines="two" class="bg-transparent pa-0">
            <v-list-item
              v-for="channel in channels"
              :key="channel.key"
              :prepend-icon="channel.icon"
              :title="t(`contact.channels.items.${channel.key}.label`)"
              :subtitle="t(`contact.channels.items.${channel.key}.value`)"
            />
          </v-list>
        </v-card>

        <v-card class="pa-5 mb-4" rounded="xl" variant="tonal">
          <h2 class="text-h6 mb-3">{{ t('contact.hours.title') }}</h2>
          <p class="text-body-2 mb-2">{{ t('contact.hours.weekdays') }}</p>
          <p class="text-body-2 mb-0">{{ t('contact.hours.weekend') }}</p>
        </v-card>

        <v-card class="pa-5" rounded="xl" variant="outlined">
          <h2 class="text-h6 mb-4">{{ t('contact.sla.title') }}</h2>
          <v-timeline density="compact" side="end" truncate-line="both">
            <v-timeline-item
              v-for="item in serviceTimeline"
              :key="item.key"
              :dot-color="item.color"
              :dot-icon="item.icon"
              fill-dot
              size="small"
            >
              <strong>{{ t(`contact.sla.items.${item.key}.title`) }}</strong>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ t(`contact.sla.items.${item.key}.description`) }}</p>
            </v-timeline-item>
          </v-timeline>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card class="pa-5" rounded="xl">
          <h2 class="text-h6 mb-4">{{ t('contact.form.title') }}</h2>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field :label="t('contact.form.fields.firstName')" variant="outlined" hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :label="t('contact.form.fields.lastName')" variant="outlined" hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :label="t('contact.form.fields.email')" type="email" variant="outlined" hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                :items="[
                  t('contact.form.topics.support'),
                  t('contact.form.topics.sales'),
                  t('contact.form.topics.partnership'),
                ]"
                :label="t('contact.form.fields.topic')"
                variant="outlined"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                :label="t('contact.form.fields.message')"
                :placeholder="t('contact.form.fields.messagePlaceholder')"
                rows="5"
                variant="outlined"
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <div class="d-flex flex-wrap ga-3 mt-4">
            <v-btn color="primary">{{ t('contact.form.submit') }}</v-btn>
            <v-btn variant="text">{{ t('contact.form.reset') }}</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </UiPageSection>
</template>
