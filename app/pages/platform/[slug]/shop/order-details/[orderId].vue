<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import orderedProductImage from '~/assets/images/shop/orders/ordered-headphones.svg'
import mastercardLogo from '~/assets/images/shop/orders/mastercard-logo.svg'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({
  public: true,
  requiresAuth: false,
  path: '/platform/:slug/shop/orders/:orderId'
})

type TimelineState = 'done' | 'current' | 'upcoming'

type TimelineStep = {
  title: string
  date: string
  icon: string
  state: TimelineState
}

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const orderId = computed(() => String(route.params.orderId ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))

const trackingTimeline: TimelineStep[] = [
  { title: 'Order confirmed', date: '12 Jan 2026 · 09:14', icon: 'mdiCheckCircle', state: 'done' },
  { title: 'Package prepared', date: '12 Jan 2026 · 13:58', icon: 'mdiPackageVariantClosed', state: 'done' },
  { title: 'In transit', date: '13 Jan 2026 · 07:32', icon: 'mdiTruckDelivery', state: 'current' },
  { title: 'Out for delivery', date: 'Expected 14 Jan 2026', icon: 'mdiMapMarkerPath', state: 'upcoming' },
  { title: 'Delivered', date: 'Expected 14 Jan 2026', icon: 'mdiHomeCheck', state: 'upcoming' }
]

const timelineColorMap: Record<TimelineState, string> = {
  done: 'success',
  current: 'primary',
  upcoming: 'medium-emphasis'
}
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        title="platform.shop.sidebar.title"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="navItems"
      />
    </template>

    <section>
      <v-card rounded="xl" class="mb-6" variant="outlined">
        <v-card-text class="d-flex flex-wrap align-center justify-space-between ga-4">
          <div>
            <p class="text-overline text-medium-emphasis mb-1">Order</p>
            <h1 class="text-h5 font-weight-bold">Order Details #{{ orderId }}</h1>
          </div>
          <v-btn color="primary" prepend-icon="mdiFileDocumentOutline" variant="flat">
            Invoice
          </v-btn>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" lg="8">
          <v-card rounded="xl" variant="outlined" class="mb-6">
            <v-card-item>
              <v-card-title>Ordered product</v-card-title>
              <template #append>
                <v-chip color="warning" variant="tonal" prepend-icon="mdiTruckFast">
                  Delivery in progress
                </v-chip>
              </template>
            </v-card-item>
            <v-divider />
            <v-card-text class="d-flex flex-wrap ga-4 align-center">
              <v-img :src="orderedProductImage" width="170" cover class="rounded-lg border" />
              <div>
                <p class="text-h6 font-weight-bold mb-1">Pro Headset X2</p>
                <p class="text-body-2 text-medium-emphasis mb-1">Color: Midnight Black · Qty: 1</p>
                <p class="text-body-2 text-medium-emphasis mb-1">Warehouse: Paris North Hub</p>
                <p class="text-body-1 font-weight-medium">Tracking #: FR-24-0089134</p>
              </div>
            </v-card-text>
          </v-card>

          <v-card rounded="xl" variant="outlined" class="mb-6">
            <v-card-item>
              <v-card-title>Tracking timeline</v-card-title>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <v-timeline side="end" density="compact" align="start" line-inset="12">
                <v-timeline-item
                  v-for="step in trackingTimeline"
                  :key="step.title"
                  :dot-color="timelineColorMap[step.state]"
                  :icon="step.icon"
                  size="small"
                >
                  <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                    <p class="font-weight-medium">{{ step.title }}</p>
                    <v-chip size="small" :color="timelineColorMap[step.state]" variant="tonal">{{ step.state }}</v-chip>
                  </div>
                  <p class="text-body-2 text-medium-emphasis mt-1">{{ step.date }}</p>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <v-card rounded="xl" variant="outlined">
            <v-card-item>
              <v-card-title>Billing information</v-card-title>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <p class="font-weight-bold mb-1">Nadia Bento</p>
              <p class="text-body-2 text-medium-emphasis mb-1">18 Rue des Tilleuls</p>
              <p class="text-body-2 text-medium-emphasis mb-1">75011 Paris · France</p>
              <p class="text-body-2 text-medium-emphasis">nadia.bento@example.com · +33 6 12 34 56 78</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card rounded="xl" variant="outlined" class="mb-6">
            <v-card-item>
              <v-card-title>Payment details</v-card-title>
            </v-card-item>
            <v-divider />
            <v-card-text class="d-flex ga-4 align-center">
              <v-avatar rounded="lg" size="58" color="grey-lighten-4">
                <v-img :src="mastercardLogo" alt="Mastercard" />
              </v-avatar>
              <div>
                <p class="font-weight-medium">Mastercard ending in 9086</p>
                <p class="text-body-2 text-medium-emphasis">Exp. 10/29 · Cardholder: Nadia Bento</p>
              </div>
            </v-card-text>
          </v-card>

          <v-card rounded="xl" variant="outlined">
            <v-card-item>
              <v-card-title>Order summary</v-card-title>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Subtotal</span>
                <span>€169.00</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Delivery</span>
                <span>€8.50</span>
              </div>
              <div class="d-flex justify-space-between mb-4">
                <span class="text-medium-emphasis">Taxes</span>
                <span>€35.50</span>
              </div>
              <v-divider class="mb-4" />
              <div class="d-flex justify-space-between text-h6 font-weight-bold">
                <span>Total</span>
                <span>€213.00</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
