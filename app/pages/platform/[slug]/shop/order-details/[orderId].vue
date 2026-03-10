<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import orderedProductImage from '~/assets/img/products/product-details-2.jpg'
import mastercardLogo from '~/assets/img/logos/mastercard.png'
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
const { t } = useI18n()
const { formatCurrency } = usePlatformI18n()

const trackingTimeline: TimelineStep[] = [
  { title: t('platform.shop.orders.tracking.steps.confirmed'), date: t('platform.shop.orders.tracking.dates.confirmed'), icon: 'mdiCheckCircle', state: 'done' },
  { title: t('platform.shop.orders.tracking.steps.prepared'), date: t('platform.shop.orders.tracking.dates.prepared'), icon: 'mdiPackageVariantClosed', state: 'done' },
  { title: t('platform.shop.orders.tracking.steps.inTransit'), date: t('platform.shop.orders.tracking.dates.inTransit'), icon: 'mdiTruckDelivery', state: 'current' },
  { title: t('platform.shop.orders.tracking.steps.outForDelivery'), date: t('platform.shop.orders.tracking.dates.expected', { date: t('platform.shop.orders.tracking.dates.expectedDate') }), icon: 'mdiMapMarkerPath', state: 'upcoming' },
  { title: t('platform.shop.orders.tracking.steps.delivered'), date: t('platform.shop.orders.tracking.dates.expected', { date: t('platform.shop.orders.tracking.dates.expectedDate') }), icon: 'mdiHomeCheck', state: 'upcoming' }
]

const timelineColorMap: Record<TimelineState, string> = {
  done: 'success',
  current: 'primary',
  upcoming: 'medium-emphasis'
}

const timelineStateLabel: Record<TimelineState, string> = {
  done: t('platform.shop.orders.tracking.timelineStates.done'),
  current: t('platform.shop.orders.tracking.timelineStates.current'),
  upcoming: t('platform.shop.orders.tracking.timelineStates.upcoming'),
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
            <p class="text-overline text-medium-emphasis mb-1">{{ t('platform.shop.orders.tracking.pageLabel') }}</p>
            <h1 class="text-h5 font-weight-bold">{{ t('platform.shop.orders.tracking.pageTitle', { orderId }) }}</h1>
          </div>
          <v-btn color="primary" prepend-icon="mdiFileDocumentOutline" variant="flat">
            {{ t('platform.shop.common.buttons.invoice') }}
          </v-btn>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" lg="8">
          <v-card rounded="xl" variant="outlined" class="mb-6">
            <v-card-item>
              <v-card-title>{{ t('platform.shop.orders.tracking.orderedProduct') }}</v-card-title>
              <template #append>
                <v-chip color="warning" variant="tonal" prepend-icon="mdiTruckFast">
                  {{ t('platform.shop.orders.tracking.deliveryInProgress') }}
                </v-chip>
              </template>
            </v-card-item>
            <v-divider />
            <v-card-text class="d-flex flex-wrap ga-4 align-center">
              <v-img :src="orderedProductImage" width="170" cover class="rounded-lg border" />
              <div>
                <p class="text-h6 font-weight-bold mb-1">{{ t('platform.shop.orders.tracking.productName') }}</p>
                <p class="text-body-2 text-medium-emphasis mb-1">{{ t('platform.shop.orders.tracking.productMeta', { color: t('platform.shop.orders.tracking.colorMidnightBlack'), quantity: 1 }) }}</p>
                <p class="text-body-2 text-medium-emphasis mb-1">{{ t('platform.shop.orders.tracking.warehouse', { warehouse: t('platform.shop.orders.tracking.warehouses.parisNorthHub') }) }}</p>
                <p class="text-body-1 font-weight-medium">{{ t('platform.shop.orders.tracking.trackingNumber', { trackingNumber: t('platform.shop.orders.tracking.trackingNumberValue') }) }}</p>
              </div>
            </v-card-text>
          </v-card>

          <v-card rounded="xl" variant="outlined" class="mb-6">
            <v-card-item>
              <v-card-title>{{ t('platform.shop.orders.tracking.timelineTitle') }}</v-card-title>
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
                    <v-chip size="small" :color="timelineColorMap[step.state]" variant="tonal">{{ timelineStateLabel[step.state] }}</v-chip>
                  </div>
                  <p class="text-body-2 text-medium-emphasis mt-1">{{ step.date }}</p>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <v-card rounded="xl" variant="outlined">
            <v-card-item>
              <v-card-title>{{ t('platform.shop.orders.tracking.billingInformation') }}</v-card-title>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <p class="font-weight-bold mb-1">{{ t('platform.shop.orders.tracking.billing.name') }}</p>
              <p class="text-body-2 text-medium-emphasis mb-1">{{ t('platform.shop.orders.tracking.billing.addressLine1') }}</p>
              <p class="text-body-2 text-medium-emphasis mb-1">{{ t('platform.shop.orders.tracking.billing.addressLine2') }}</p>
              <p class="text-body-2 text-medium-emphasis">{{ t('platform.shop.orders.tracking.billing.contact', { email: t('platform.shop.orders.tracking.billing.email'), phone: t('platform.shop.orders.tracking.billing.phone') }) }}</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card rounded="xl" variant="outlined" class="mb-6">
            <v-card-item>
              <v-card-title>{{ t('platform.shop.orders.tracking.paymentDetails') }}</v-card-title>
            </v-card-item>
            <v-divider />
            <v-card-text class="d-flex ga-4 align-center">
              <v-avatar rounded="lg" size="58" color="grey-lighten-4">
                <v-img :src="mastercardLogo" :alt="t('platform.shop.orders.tracking.paymentAlt')" />
              </v-avatar>
              <div>
                <p class="font-weight-medium">{{ t('platform.shop.orders.tracking.paymentCard', { last4: t('platform.shop.orders.tracking.paymentLast4') }) }}</p>
                <p class="text-body-2 text-medium-emphasis">{{ t('platform.shop.orders.tracking.paymentMeta', { expiry: t('platform.shop.orders.tracking.paymentExpiry'), holder: t('platform.shop.orders.tracking.billing.name') }) }}</p>
              </div>
            </v-card-text>
          </v-card>

          <v-card rounded="xl" variant="outlined">
            <v-card-item>
              <v-card-title>{{ t('platform.shop.orders.tracking.summaryTitle') }}</v-card-title>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">{{ t('platform.shop.orders.tracking.summary.subtotal') }}</span>
                <span>{{ formatCurrency(169) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">{{ t('platform.shop.orders.tracking.summary.delivery') }}</span>
                <span>{{ formatCurrency(8.5, 'EUR') }}</span>
              </div>
              <div class="d-flex justify-space-between mb-4">
                <span class="text-medium-emphasis">{{ t('platform.shop.orders.tracking.summary.taxes') }}</span>
                <span>{{ formatCurrency(35.5, 'EUR') }}</span>
              </div>
              <v-divider class="mb-4" />
              <div class="d-flex justify-space-between text-h6 font-weight-bold">
                <span>{{ t('platform.shop.orders.tracking.summary.total') }}</span>
                <span>{{ formatCurrency(213) }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
