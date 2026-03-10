<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopPrimaryAction from '~/components/platform/shop/admin/ShopPrimaryAction.vue'
import ShopSecondaryAction from '~/components/platform/shop/admin/ShopSecondaryAction.vue'
import ShopSectionTitle from '~/components/platform/shop/admin/ShopSectionTitle.vue'
import ShopOrdersTable from '~/components/platform/shop/ShopOrdersTable.vue'
import UiEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiLoadingState from '~/components/ui/state/UiLoadingState.vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'
import { shopOrders, type ShopOrderStatus } from '~/data/shop-orders'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
const { t } = useI18n()

const search = ref('')
const selectedStatuses = ref<ShopOrderStatus[]>([])
const uiStatus = ref<'ready' | 'loading' | 'error'>('ready')

const availableStatuses: { label: string, value: ShopOrderStatus }[] = [
  { label: t('platform.shop.common.statuses.paid'), value: 'paid' },
  { label: t('platform.shop.common.statuses.refunded'), value: 'refunded' },
  { label: t('platform.shop.common.statuses.canceled'), value: 'canceled' },
]

const filteredOrders = computed(() => {
  const query = search.value.trim().toLowerCase()

  return shopOrders.filter((order) => {
    const matchesStatus = selectedStatuses.value.length === 0 || selectedStatuses.value.includes(order.status)

    if (!query) {
      return matchesStatus
    }

    const inSearch = [
      order.orderNumber,
      order.customer.name,
      order.customer.email,
      order.status,
      order.revenue,
    ].join(' ').toLowerCase().includes(query)

    return matchesStatus && inSearch
  })
})

const exportToCsv = async () => {
  uiStatus.value = 'loading'
  await new Promise((resolve) => setTimeout(resolve, 450))

  if (!filteredOrders.value.length) {
    uiStatus.value = 'error'
    return
  }

  const headers = [
    t('platform.shop.orders.table.headers.order'),
    t('platform.shop.orders.table.headers.customer'),
    t('platform.shop.orders.table.headers.email'),
    t('platform.shop.orders.table.headers.status'),
    t('platform.shop.orders.table.headers.date'),
    t('platform.shop.orders.table.headers.items'),
    t('platform.shop.orders.table.headers.revenue'),
  ]
  const rows = filteredOrders.value.map(order => [
    order.orderNumber,
    order.customer.name,
    order.customer.email,
    order.status,
    order.createdAt,
    String(order.items),
    order.revenue,
  ])

  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.setAttribute('href', url)
  link.setAttribute('download', t('platform.shop.orders.csvFilename'))
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  uiStatus.value = 'ready'
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

    <section class="d-flex flex-column ga-4 platform-shop-admin-page">
      <ShopSectionTitle :title="t('platform.shop.orders.title')" :subtitle="t('platform.shop.orders.subtitle')">
        <template #actions>
          <ShopPrimaryAction prepend-icon="mdi-plus">{{ t('platform.shop.common.buttons.newOrder') }}</ShopPrimaryAction>

          <v-menu location="bottom end">
            <template #activator="{ props }">
              <ShopSecondaryAction v-bind="props" prepend-icon="mdi-filter-variant">{{ t('platform.shop.common.buttons.filters') }}</ShopSecondaryAction>
            </template>

            <v-card min-width="260" rounded="lg">
              <v-list>
                <v-list-subheader>{{ t('platform.shop.orders.filters.statusTitle') }}</v-list-subheader>
                <v-list-item
                  v-for="status in availableStatuses"
                  :key="status.value"
                  @click="selectedStatuses = selectedStatuses.includes(status.value) ? selectedStatuses.filter(item => item !== status.value) : [...selectedStatuses, status.value]"
                >
                  <template #prepend>
                    <v-checkbox-btn :model-value="selectedStatuses.includes(status.value)" />
                  </template>
                  <v-list-item-title>{{ status.label }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>

          <ShopSecondaryAction prepend-icon="mdi-file-delimited-outline" @click="exportToCsv">{{ t('platform.shop.common.buttons.exportCsv') }}</ShopSecondaryAction>
        </template>
      </ShopSectionTitle>

      <div class="platform-shop-admin-toolbar">
        <p class="platform-shop-admin-title text-subtitle-2 mb-0">{{ t('platform.shop.orders.subtitle') }}</p>
        <ShopSecondaryAction prepend-icon="mdi-refresh" @click="uiStatus = 'ready'">{{ t('platform.filters.clear') }}</ShopSecondaryAction>
      </div>

      <v-text-field
        v-model="search"
        :label="t('platform.shop.orders.searchLabel')" :aria-label="t('platform.shop.orders.searchLabel')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        clearable
        hide-details
      />

      <UiLoadingState
        v-if="uiStatus === 'loading'"
        class="platform-shop-admin-state"
        variant="datatable"
      />

      <UiStateAlert
        v-else-if="uiStatus === 'error'"
        class="platform-shop-admin-state"
        type="error"
        :message="t('platform.shop.orders.errors.searchUnavailableNoData', { label: t('platform.shop.orders.searchLabel') })"
      />

      <UiEmptyState
        v-else-if="filteredOrders.length === 0"
        class="platform-shop-admin-state"
        icon="mdi-text-box-search-outline"
        :title="t('platform.shop.orders.title')"
        :description="t('platform.shop.orders.searchLabel')"
      />

      <div v-else class="platform-shop-admin-table">
        <ShopOrdersTable :orders="filteredOrders" :platform-slug="slug" />
      </div>
    </section>
  </PlatformSplitLayout>
</template>
