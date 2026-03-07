<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

interface ContactChannel {
  label: string
  value: string
  details: string
  icon: string
}

interface AvailabilityWindow {
  label: string
  value: string
}

interface ContactAvailability {
  title: string
  description: string
  windows: AvailabilityWindow[]
  escalationTitle: string
  escalationBullets: string[]
}

interface ContactTopic {
  value: string
  label: string
}

interface ContactForm {
  title: string
  description: string
  fields: {
    firstName: string
    lastName: string
    email: string
    topic: string
    message: string
    messagePlaceholder: string
  }
  topics: ContactTopic[]
  privacyNote: string
  submit: string
  reset: string
}

interface ContactCtaAction {
  label: string
  variant: 'primary' | 'outlined'
}

interface ContactCta {
  title: string
  description: string
  actions: ContactCtaAction[]
}

const { t, tm } = useI18n()

const channels = computed(() => tm('contact.channels') as ContactChannel[])
const availability = computed(() => tm('contact.availability') as ContactAvailability)
const contactForm = computed(() => tm('contact.form') as ContactForm)
const cta = computed(() => tm('contact.cta') as ContactCta)

const topicLabels = computed(() => contactForm.value.topics.map((topic) => topic.label))
</script>

<template>
  <main class="contact-page py-12 py-md-16">
    <UiPageSection class="contact-container" max-width="1100">
      <v-fade-transition appear>
        <v-card class="contact-panel contact-panel--primary mb-6 transition-elevation" elevation="4" rounded="xl" hover>
          <v-chip class="contact-badge" color="primary" variant="tonal">{{ t('contact.hero.badge') }}</v-chip>
          <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ t('contact.hero.title') }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-6">{{ t('contact.hero.subtitle') }}</p>

          <div class="d-flex flex-wrap ga-3">
            <v-btn color="primary">{{ t('contact.hero.primaryCta') }}</v-btn>
            <v-btn variant="outlined">{{ t('contact.hero.secondaryCta') }}</v-btn>
          </div>
        </v-card>
      </v-fade-transition>

      <v-row class="contact-layout" dense>
        <v-col cols="12" md="5">
          <v-card class="contact-panel contact-panel--secondary mb-4 transition-elevation" rounded="xl" hover>
            <h2 class="text-h6 mb-4">{{ t('contact.title') }}</h2>
            <v-list lines="three" class="bg-transparent pa-0">
              <v-list-item
                v-for="channel in channels"
                :key="channel.label"
                :title="channel.label"
                :subtitle="`${channel.value} · ${channel.details}`"
              >
                <template #prepend>
                  <v-avatar class="contact-channel__icon" rounded="lg" size="34">
                    <v-icon :icon="channel.icon" />
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <v-card class="contact-availability mb-4" rounded="xl" variant="tonal">
            <h2 class="text-h6 mb-2">{{ availability.title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-3">{{ availability.description }}</p>
            <p v-for="window in availability.windows" :key="window.label" class="text-body-2 mb-2">
              <strong>{{ window.label }}:</strong> {{ window.value }}
            </p>
            <h3 class="text-subtitle-2 mt-4 mb-2">{{ availability.escalationTitle }}</h3>
            <ul class="text-body-2 ps-5 mb-0">
              <li v-for="bullet in availability.escalationBullets" :key="bullet" class="mb-1">{{ bullet }}</li>
            </ul>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card class="contact-form-wrapper" rounded="xl">
            <h2 class="text-h6 mb-2">{{ contactForm.title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-4">{{ contactForm.description }}</p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field :label="contactForm.fields.firstName" variant="outlined" hide-details="auto" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field :label="contactForm.fields.lastName" variant="outlined" hide-details="auto" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field :label="contactForm.fields.email" type="email" variant="outlined" hide-details="auto" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  :items="topicLabels"
                  :label="contactForm.fields.topic"
                  variant="outlined"
                  hide-details="auto"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  :label="contactForm.fields.message"
                  :placeholder="contactForm.fields.messagePlaceholder"
                  rows="5"
                  variant="outlined"
                  hide-details="auto"
                />
              </v-col>
            </v-row>
            <p class="text-caption text-medium-emphasis mt-4 mb-0">{{ contactForm.privacyNote }}</p>
            <div class="d-flex flex-wrap ga-3 mt-4">
              <v-btn color="primary">{{ contactForm.submit }}</v-btn>
              <v-btn variant="text">{{ contactForm.reset }}</v-btn>
            </div>
          </v-card>

          <v-card class="contact-channel mt-4" rounded="xl" variant="outlined">
            <h2 class="text-h6 mb-2">{{ cta.title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-4">{{ cta.description }}</p>
            <div class="d-flex flex-wrap ga-3">
              <v-btn
                v-for="action in cta.actions"
                :key="action.label"
                :color="action.variant === 'primary' ? 'primary' : undefined"
                :variant="action.variant === 'outlined' ? 'outlined' : 'flat'"
              >
                {{ action.label }}
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </UiPageSection>
  </main>
</template>
