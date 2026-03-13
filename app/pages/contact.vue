<script setup lang="ts">
import { usePublicPagesStore } from '~/stores/publicPages'

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
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

interface ContactHero {
  badge: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
}

interface ContactPagePayload {
  title: string
  hero: ContactHero
  channels: ContactChannel[]
  availability: ContactAvailability
  form: ContactForm
  cta: ContactCta
}

// Mock API response (GET /api/public/pages/contact)
const contactPagePayload = ref<ContactPagePayload>({
  title: 'Contact',
  hero: {
    badge: 'Contact',
    title: 'Parlons de votre besoin',
    subtitle: 'Page connected to fake JSON to define the backend data contract.',
    primaryCta: 'Planifier un appel',
    secondaryCta: 'Ouvrir un ticket',
  },
  channels: [
    { label: 'Email', value: 'support@bro-world.io', details: 'Answer sous 24h', icon: 'mdi-email-outline' },
    { label: 'Phone', value: '+33 1 23 45 67 89', details: 'Lundi au vendredi', icon: 'mdi-phone-outline' },
  ],
  availability: {
    title: 'Availability',
    description: 'Response slots managed by the support team.',
    windows: [
      { label: 'Support standard', value: '09:00 - 18:00 CET' },
      { label: 'Urgences', value: '24/7 pour incidents critiques' },
    ],
    escalationTitle: 'Escalade',
    escalationBullets: ['Level 1: support', 'Level 2: product team', 'Level 3: engineering lead'],
  },
  form: {
    title: 'Formulaire de contact',
    description: 'The following fields represent the structure expected from the API.',
    fields: {
      firstName: 'First name',
      lastName: 'Nom',
      email: 'Email professionnel',
      topic: 'Sujet',
      message: 'Message',
      messagePlaceholder: 'Describe your request…',
    },
    topics: [
      { value: 'sales', label: 'Demande commerciale' },
      { value: 'support', label: 'Support technique' },
      { value: 'partnership', label: 'Partenariat' },
    ],
    privacyNote: 'By submitting this form, you accept the processing of your data.',
    submit: 'Envoyer',
    reset: 'Reset',
  },
  cta: {
    title: 'Autres canaux',
    description: 'These actions can also be managed dynamically on the backend.',
    actions: [
      { label: 'Chat en direct', variant: 'primary' },
      { label: 'Centre d’aide', variant: 'outlined' },
    ],
  },
})

const topicLabels = computed(() => contactPagePayload.value.form.topics.map((topic) => topic.label))

const publicPagesStore = usePublicPagesStore()
const { locale } = useI18n()
const isLoading = ref(true)

const loadPageContent = async () => {
  isLoading.value = true
  try {
    contactPagePayload.value = await publicPagesStore.loadContact(locale.value)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadPageContent)
watch(locale, loadPageContent)
</script>

<template>
  <main class="contact-page">
    <template v-if="isLoading">
      <v-card class="contact-panel contact-panel--primary mb-6" rounded="xl">
        <v-skeleton-loader type="chip" class="mb-3" />
        <v-skeleton-loader type="heading" class="mb-2" />
        <v-skeleton-loader type="text@2" class="mb-4" />
        <v-skeleton-loader type="button@2" />
      </v-card>

      <v-row dense>
        <v-col cols="12" md="5">
          <v-card rounded="xl" class="mb-4 pa-4">
            <v-skeleton-loader type="heading" class="mb-3" />
            <v-skeleton-loader type="list-item-two-line@2" />
          </v-card>
          <v-card rounded="xl" class="pa-4">
            <v-skeleton-loader type="heading" class="mb-2" />
            <v-skeleton-loader type="text@4" />
          </v-card>
        </v-col>
        <v-col cols="12" md="7">
          <v-card rounded="xl" class="pa-4 mb-4">
            <v-skeleton-loader type="heading" class="mb-2" />
            <v-skeleton-loader type="text" class="mb-3" />
            <v-skeleton-loader type="text@6" />
          </v-card>
          <v-card rounded="xl" class="pa-4">
            <v-skeleton-loader type="heading" class="mb-2" />
            <v-skeleton-loader type="button@2" />
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
    <v-fade-transition appear>
      <v-card class="contact-panel contact-panel--primary mb-6 transition-elevation" elevation="4" rounded="xl" hover>
        <v-chip class="contact-badge" color="primary" variant="tonal">{{ contactPagePayload.hero.badge }}</v-chip>
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ contactPagePayload.hero.title }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">{{ contactPagePayload.hero.subtitle }}</p>

        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary">{{ contactPagePayload.hero.primaryCta }}</v-btn>
          <v-btn variant="outlined">{{ contactPagePayload.hero.secondaryCta }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>

    <v-row class="contact-layout" dense>
      <v-col cols="12" md="5">
        <v-card class="contact-panel contact-panel--secondary mb-4 transition-elevation" rounded="xl" hover>
          <h2 class="text-h6 mb-4">{{ contactPagePayload.title }}</h2>
          <v-list lines="three" class="bg-transparent pa-0">
            <v-list-item
              v-for="channel in contactPagePayload.channels"
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
          <h2 class="text-h6 mb-2">{{ contactPagePayload.availability.title }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-3">{{ contactPagePayload.availability.description }}</p>
          <p v-for="window in contactPagePayload.availability.windows" :key="window.label" class="text-body-2 mb-2">
            <strong>{{ window.label }}:</strong> {{ window.value }}
          </p>
          <h3 class="text-subtitle-2 mt-4 mb-2">{{ contactPagePayload.availability.escalationTitle }}</h3>
          <ul class="text-body-2 ps-5 mb-0">
            <li v-for="bullet in contactPagePayload.availability.escalationBullets" :key="bullet" class="mb-1">{{ bullet }}</li>
          </ul>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card class="contact-form-wrapper" rounded="xl">
          <h2 class="text-h6 mb-2">{{ contactPagePayload.form.title }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ contactPagePayload.form.description }}</p>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field :label="contactPagePayload.form.fields.firstName" variant="outlined" hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :label="contactPagePayload.form.fields.lastName" variant="outlined" hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field :label="contactPagePayload.form.fields.email" type="email" variant="outlined" hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                :items="topicLabels"
                :label="contactPagePayload.form.fields.topic"
                variant="outlined"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                :label="contactPagePayload.form.fields.message"
                :placeholder="contactPagePayload.form.fields.messagePlaceholder"
                rows="5"
                variant="outlined"
                hide-details="auto"
              />
            </v-col>
          </v-row>
          <p class="text-caption text-medium-emphasis mt-4 mb-0">{{ contactPagePayload.form.privacyNote }}</p>
          <div class="d-flex flex-wrap ga-3 mt-4">
            <v-btn color="primary">{{ contactPagePayload.form.submit }}</v-btn>
            <v-btn variant="text">{{ contactPagePayload.form.reset }}</v-btn>
          </div>
        </v-card>

        <LazyContactSecondaryCta
          hydrate-on-visible
          :cta="contactPagePayload.cta"
        />
      </v-col>
    </v-row>
    </template>
  </main>
</template>
<style scoped>
.contact-page {
  padding: 3.5rem;
}
</style>
