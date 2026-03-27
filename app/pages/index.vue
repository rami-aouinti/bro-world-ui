<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import { defineAsyncComponent, computed, nextTick, onMounted, ref } from 'vue'
import { usePublicPagesStore } from '~/stores/publicPages'

const HomeSecondarySections = defineAsyncComponent(() => import('~/components/marketing/home/HomeSecondarySections.vue'))

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
})

useHead({
  title: 'Home',
})

const publicPagesStore = usePublicPagesStore()
const { locale } = useI18n()

const homePagePayload = ref<Any>(null)
const showNavigationSkeleton = ref(true)
const showSecondarySections = ref(true)

const loadPageContent = async () => {
  showNavigationSkeleton.value = true
  try {
    homePagePayload.value = await publicPagesStore.loadHome(locale.value)
  }
  finally {
    showNavigationSkeleton.value = false
  }
}


onMounted(loadPageContent)
watch(locale, loadPageContent)
</script>

<template>
  <main class="home-page">
    <template v-if="showNavigationSkeleton">
      <v-card class="home-hero mb-6">
        <v-skeleton-loader type="chip" class="mb-4 home-hero__badge-skeleton" />
        <v-skeleton-loader type="heading" class="mb-2 home-hero__title-skeleton" />
        <v-skeleton-loader type="text@2" class="mb-4 home-hero__subtitle-skeleton" />
        <v-skeleton-loader type="button@2" class="mb-4 home-hero__actions-skeleton" />
        <v-skeleton-loader type="list-item-two-line@3" />
      </v-card>

      <v-card class="home-section home-section--above-fold mb-6">
        <v-skeleton-loader type="heading" class="mb-4" />
        <v-row>
          <v-col v-for="index in 3" :key="`feature-skeleton-${index}`" cols="12" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
      </v-card>
    </template>

    <template v-else-if="homePagePayload">
      <UiCard class="home-hero mb-6" kind="hero" theme="light-pink">
        <v-chip class="home-hero__badge mb-4" color="primary" variant="tonal">
          {{ homePagePayload?.hero?.badge }}
        </v-chip>

        <h1 class="home-hero__title text-h4 text-md-h3 font-weight-bold mb-2">{{ homePagePayload?.hero?.title }}</h1>
        <p class="home-hero__subtitle text-body-1 text-medium-emphasis mb-5">{{ homePagePayload?.hero?.subtitle }}</p>

        <div class="home-hero__actions mb-5">
          <v-btn class="home-hero__btn" color="primary" size="large">{{ homePagePayload?.hero?.primaryCta }}</v-btn>
          <v-btn class="home-hero__btn" variant="outlined" size="large">{{ homePagePayload?.hero?.secondaryCta }}</v-btn>
        </div>

        <ul class="home-hero__benefits text-body-2 ps-5 mb-0">
          <li v-for="benefit in homePagePayload.hero.benefits" :key="benefit" class="mb-1">{{ benefit }}</li>
        </ul>
      </UiCard>

      <div v-if="showSecondarySections">
        <HomeSecondarySections :payload="homePagePayload" />
      </div>
    </template>

    <template v-else>
      <UiCard class="home-hero mb-6" kind="hero" theme="light-pink">
        <h1 class="home-hero__title text-h4 text-md-h3 font-weight-bold mb-2">BroWorld</h1>
        <p class="home-hero__subtitle text-body-1 text-medium-emphasis mb-5">
          {{ error ? "La page d'accueil n'a pas pu être chargée." : 'Chargement en cours…' }}
        </p>
        <v-btn class="home-hero__btn" color="primary" size="large" @click="refresh">Réessayer</v-btn>
      </UiCard>
    </template>
  </main>
</template>

<style scoped>
.home-page :deep(.v-card),
.home-page :deep(.ui-card),
.home-page :deep(.v-badge),
.home-page :deep(.v-progress-linear) {
  transition-property: transform, opacity, background-color, border-color, color !important;
}

.home-page :deep(.v-card),
.home-page :deep(.ui-card) {
  will-change: transform, opacity;
}

.home-page :deep(.v-badge),
.home-page :deep(.online-badge),
.home-page :deep(.offline-badge),
.home-page :deep(.v-progress-linear),
.home-page :deep(.v-progress-linear__background),
.home-page :deep(.v-progress-linear__determinate) {
  animation: none !important;
}

.home-hero__title,
.home-hero__title-skeleton {
  min-height: 3.25rem;
}

.home-hero__subtitle,
.home-hero__subtitle-skeleton {
  min-height: 3.2rem;
}

.home-hero__actions,
.home-hero__actions-skeleton {
  min-height: 2.75rem;
}

.home-hero__badge,
.home-hero__badge-skeleton {
  min-height: 2rem;
}

@media (max-width: 959px) {
  .home-hero__title,
  .home-hero__title-skeleton {
    min-height: 2.65rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page :deep(.v-card),
  .home-page :deep(.ui-card),
  .home-page :deep(.v-badge),
  .home-page :deep(.v-progress-linear) {
    transition: none !important;
    transform: none !important;
    animation: none !important;
  }
}
</style>
