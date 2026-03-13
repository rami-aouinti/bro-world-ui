<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import HomeSecondarySections from '~/components/marketing/home/HomeSecondarySections.server.vue'
import type { HomePagePayload } from '~/types/api/page'
import { usePublicPagesStore } from '~/stores/publicPages'
import {ref} from "vue";

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
})

const publicPagesStore = usePublicPagesStore()
const { locale } = useI18n()
const homePagePayload = ref<HomePagePayload>({})

const isLoading = ref(true)

const loadPageHome = async () => {
  isLoading.value = true
  try {
    homePagePayload.value = await publicPagesStore.loadHome(locale.value)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadPageHome)
watch(locale, loadPageHome)
</script>

<template>
  <main class="home-page">
    <template v-if="isLoading || !homePagePayload">
      <v-card class="home-hero mb-6" rounded="xl">
        <v-skeleton-loader type="chip" class="mb-4" />
        <v-skeleton-loader type="heading" class="mb-2" />
        <v-skeleton-loader type="text@2" class="mb-4" />
        <v-skeleton-loader type="button@2" class="mb-4" />
        <v-skeleton-loader type="list-item-two-line@3" />
      </v-card>

      <v-card class="home-section mb-6" rounded="xl">
        <v-skeleton-loader type="heading" class="mb-4" />
        <v-row>
          <v-col v-for="index in 3" :key="`feature-skeleton-${index}`" cols="12" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
      </v-card>
    </template>

    <template v-else>
      <v-fade-transition appear>
        <UiCard class="home-hero mb-6" kind="hero">
          <v-chip class="home-hero__badge mb-4" color="primary" variant="tonal">
            {{ homePagePayload?.hero?.badge }}
          </v-chip>

          <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ homePagePayload?.hero?.title }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-5">{{ homePagePayload?.hero?.subtitle }}</p>

          <div class="home-hero__actions mb-5">
            <v-btn class="home-hero__btn" color="primary" size="large">{{ homePagePayload?.hero?.primaryCta }}</v-btn>
            <v-btn class="home-hero__btn" variant="outlined" size="large">{{ homePagePayload?.hero?.secondaryCta }}</v-btn>
          </div>

          <ul class="home-hero__benefits text-body-2 ps-5 mb-0">
            <li v-for="benefit in homePagePayload.hero.benefits" :key="benefit" class="mb-1">{{ benefit }}</li>
          </ul>
        </UiCard>
      </v-fade-transition>

      <HomeSecondarySections :payload="homePagePayload" />
    </template>
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
