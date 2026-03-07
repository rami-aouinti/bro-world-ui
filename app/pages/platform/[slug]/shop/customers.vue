<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import type { NavItem } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const customers = [
  { name: 'Lina M.', segment: 'VIP', orders: 42, ltv: '€4 320' },
  { name: 'Thomas G.', segment: 'Premium', orders: 27, ltv: '€2 180' },
  { name: 'Yara K.', segment: 'New', orders: 3, ltv: '€190' },
  { name: 'Nico D.', segment: 'Returning', orders: 16, ltv: '€1 240' },
]
const navItems = computed(() => getShopNav(slug.value, false))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="Shop Customers" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Customer Intelligence" subtitle="Segmentation, fidélité, lifetime value et recommandations" cta="Exporter CRM" />
      <v-row>
        <v-col v-for="customer in customers" :key="customer.name" cols="12" md="6" lg="3">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ customer.name }}</p>
              <p class="text-body-2 text-medium-emphasis">{{ customer.segment }}</p>
              <div class="d-flex justify-space-between mt-2 text-caption">
                <span>{{ customer.orders }} commandes</span><span>{{ customer.ltv }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
