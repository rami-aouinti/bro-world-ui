<script setup lang="ts">
import { usePublicPagesStore } from '~/stores/publicPages'

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
})

interface HomeHero {
  badge: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
  benefits: string[]
}

interface HomeFeatureCard {
  icon: string
  title: string
  description: string
}

interface HomeMetric {
  value: string
  label: string
}

interface HomeStep {
  title: string
  description: string
  icon: string
}

interface HomeCta {
  title: string
  description: string
  primaryAction: string
  secondaryAction: string
}

interface HomePagePayload {
  featuresTitle: string
  metricsTitle: string
  stepsTitle: string
  stepLabelPrefix: string
  hero: HomeHero
  featureCards: HomeFeatureCard[]
  metrics: HomeMetric[]
  steps: HomeStep[]
  cta: HomeCta
}

// Mock de réponse API (GET /api/private/pages/home)
const homePagePayload = ref<HomePagePayload>({
  featuresTitle: 'Fonctionnalités principales',
  metricsTitle: 'Indicateurs de performance',
  stepsTitle: 'Comment ça marche',
  stepLabelPrefix: 'Étape',
  hero: {
    badge: 'Accueil',
    title: 'Pilotez votre activité depuis un espace unique',
    subtitle: 'Cette page racine est alimentée avec un JSON fake pour clarifier le contrat backend.',
    primaryCta: 'Créer un projet',
    secondaryCta: 'Voir les tutoriels',
    benefits: ['Suivi en temps réel', 'Permissions avancées', 'Reporting exportable'],
  },
  featureCards: [
    {
      icon: 'mdi-view-dashboard-outline',
      title: 'Dashboard unifié',
      description: 'Vue centralisée de vos KPIs, tâches et alertes prioritaires.',
    },
    {
      icon: 'mdi-account-group-outline',
      title: 'Collaboration équipe',
      description: 'Partage d’informations et historique d’actions sur chaque module.',
    },
    {
      icon: 'mdi-shield-check-outline',
      title: 'Sécurité renforcée',
      description: 'Gestion des rôles et journalisation des accès sensibles.',
    },
  ],
  metrics: [
    { value: '250+', label: 'Utilisateurs actifs / semaine' },
    { value: '99.9%', label: 'Disponibilité service' },
    { value: '4.8/5', label: 'Note moyenne client' },
  ],
  steps: [
    {
      icon: 'mdi-account-plus-outline',
      title: 'Créer votre espace',
      description: 'Initialisez votre organisation et invitez vos collaborateurs.',
    },
    {
      icon: 'mdi-tune-variant',
      title: 'Configurer vos modules',
      description: 'Activez les options nécessaires selon votre workflow.',
    },
    {
      icon: 'mdi-chart-areaspline',
      title: 'Suivre et optimiser',
      description: 'Analysez les résultats et ajustez vos actions en continu.',
    },
  ],
  cta: {
    title: 'Prêt à aller plus loin ?',
    description: 'Ce bloc final doit aussi être renvoyé par le backend dans la réponse.',
    primaryAction: 'Demander une démo',
    secondaryAction: 'Contacter un expert',
  },
})

const publicPagesStore = usePublicPagesStore()
const { locale } = useI18n()

const loadPageContent = async () => {
  homePagePayload.value = await publicPagesStore.loadHome(locale.value)
}

onMounted(loadPageContent)
watch(locale, loadPageContent)
</script>

<template>
  <main class="home-page">
    <v-fade-transition appear>
      <v-card class="home-hero mb-6" rounded="xl" elevation="4" hover>
        <v-chip class="home-hero__badge mb-4" color="primary" variant="tonal">
          {{ homePagePayload.hero.badge }}
        </v-chip>

        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ homePagePayload.hero.title }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-5">{{ homePagePayload.hero.subtitle }}</p>

        <div class="home-hero__actions mb-5">
          <v-btn class="home-hero__btn" color="primary" size="large">{{ homePagePayload.hero.primaryCta }}</v-btn>
          <v-btn class="home-hero__btn" variant="outlined" size="large">{{ homePagePayload.hero.secondaryCta }}</v-btn>
        </div>

        <ul class="home-hero__benefits text-body-2 ps-5 mb-0">
          <li v-for="benefit in homePagePayload.hero.benefits" :key="benefit" class="mb-1">{{ benefit }}</li>
        </ul>
      </v-card>
    </v-fade-transition>

    <v-card class="home-section mb-6" rounded="xl">
      <h2 class="text-h6 mb-4">{{ homePagePayload.featuresTitle }}</h2>
      <v-row density="compact">
        <v-col v-for="card in homePagePayload.featureCards" :key="card.title" cols="12" md="4">
          <v-card class="home-feature-card h-100" rounded="lg" hover variant="outlined">
            <v-icon :icon="card.icon" class="home-feature-card__icon mb-3" />
            <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ card.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ card.description }}</p>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-expand-transition>
      <v-card class="home-section mb-6" rounded="xl" variant="tonal">
        <h2 class="text-h6 mb-4">{{ homePagePayload.metricsTitle }}</h2>
        <v-row density="compact">
          <v-col v-for="metric in homePagePayload.metrics" :key="metric.label" cols="12" md="4">
            <v-card class="home-metric-card h-100" rounded="lg" variant="flat">
              <p class="home-metric-card__value text-h5 font-weight-bold mb-1">{{ metric.value }}</p>
              <p class="home-metric-card__label text-body-2 text-medium-emphasis mb-0">{{ metric.label }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-expand-transition>

    <v-expand-transition>
      <v-card class="home-section mb-6" rounded="xl" variant="outlined">
        <h2 class="text-h6 mb-4">{{ homePagePayload.stepsTitle }}</h2>
        <v-row density="compact">
          <v-col v-for="(step, index) in homePagePayload.steps" :key="step.title" cols="12" md="4">
            <v-card class="home-step-card h-100" rounded="lg">
              <div class="d-flex align-center ga-2 mb-2">
                <v-icon :icon="step.icon" class="home-step-card__icon" />
                <p class="text-caption text-medium-emphasis mb-0">{{ homePagePayload.stepLabelPrefix }} {{ index + 1 }}</p>
              </div>
              <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ step.title }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ step.description }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-expand-transition>

    <v-fade-transition>
      <v-card class="home-final-cta" rounded="xl" elevation="2">
        <h2 class="text-h6 mb-2">{{ homePagePayload.cta.title }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">{{ homePagePayload.cta.description }}</p>
        <div class="home-final-cta__actions">
          <v-btn class="home-final-cta__btn" color="primary">{{ homePagePayload.cta.primaryAction }}</v-btn>
          <v-btn class="home-final-cta__btn" variant="outlined">{{ homePagePayload.cta.secondaryAction }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>
  </main>
</template>

<style scoped>
.home-page {
  padding: 3.5rem;
}

.home-hero,
.home-section,
.home-final-cta {
  padding: 1.5rem;
}

.home-hero__actions,
.home-final-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.home-hero__btn,
.home-final-cta__btn {
  min-width: 12rem;
}

.home-feature-card,
.home-metric-card,
.home-step-card {
  padding: 1rem;
}

.home-feature-card__icon,
.home-step-card__icon {
  color: rgb(var(--v-theme-primary));
}
</style>
