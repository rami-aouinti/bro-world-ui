<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const { t } = useI18n()
const { formatCurrency } = usePlatformI18n()

const customers = [
  { name: 'Lina M.', segment: 'VIP', orders: 42, ltv: 4320 },
  { name: 'Thomas G.', segment: 'Premium', orders: 27, ltv: 2180 },
  { name: 'Yara K.', segment: 'New', orders: 3, ltv: 190 },
  { name: 'Nico D.', segment: 'Returning', orders: 16, ltv: 1240 },
]
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.customers" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.shop.hero.customers.title" subtitle="platform.shop.hero.customers.subtitle" cta="platform.shop.hero.customers.cta" />
      <v-row>
        <v-col v-for="customer in customers" :key="customer.name" cols="12" md="6" lg="3">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ customer.name }}</p>
              <p class="text-body-2 text-medium-emphasis">{{ customer.segment }}</p>
              <div class="d-flex justify-space-between mt-2 text-caption">
                <span>{{ t('platform.shop.customers.orders', { count: customer.orders }) }}</span><span>{{ formatCurrency(customer.ltv) }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
