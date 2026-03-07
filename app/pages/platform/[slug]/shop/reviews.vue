<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import type { NavItem } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const reviews = [
  { product: 'Premium Hoodie', rating: 5, author: 'Sophie', body: 'Qualité top, livraison rapide.' },
  { product: 'Desk Setup Kit', rating: 4, author: 'Marc', body: 'Excellent bundle, manque juste un câble.' },
  { product: 'Sport Performance Pack', rating: 5, author: 'Nora', body: 'Très bonne surprise, design premium.' },
]
const navItems = computed(() => getShopNav(slug.value, false))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Shop Reviews" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Avis clients" subtitle="Analyse de sentiment, modération et confiance produit" cta="Publier widget" />
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
