<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import type { NavItem } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { t } = useI18n()
const reviews = computed(() => [
  {
    product: t('platform.shop.reviews.items.premiumHoodie.product'),
    rating: 5,
    author: t('platform.shop.reviews.items.premiumHoodie.author'),
    body: t('platform.shop.reviews.items.premiumHoodie.body'),
  },
  {
    product: t('platform.shop.reviews.items.deskSetupKit.product'),
    rating: 4,
    author: t('platform.shop.reviews.items.deskSetupKit.author'),
    body: t('platform.shop.reviews.items.deskSetupKit.body'),
  },
  {
    product: t('platform.shop.reviews.items.sportPerformancePack.product'),
    rating: 5,
    author: t('platform.shop.reviews.items.sportPerformancePack.author'),
    body: t('platform.shop.reviews.items.sportPerformancePack.body'),
  },
])
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.reviews" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.shop.hero.reviews.title" subtitle="platform.shop.hero.reviews.subtitle" cta="platform.shop.hero.reviews.cta" />
      <v-row>
        <v-col v-for="review in reviews" :key="review.author" cols="12" md="4">
          <v-card rounded="xl">
            <v-card-text>
              <p class="font-weight-bold mb-1">{{ review.product }}</p>
              <p class="text-body-2 mb-2">{{ review.body }}</p>
              <v-rating :model-value="review.rating" readonly density="compact" size="small" color="amber" />
              <p class="text-caption mt-2 text-medium-emphasis">— {{ review.author }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
