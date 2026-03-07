<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopPrimaryAction from '~/components/platform/shop/admin/ShopPrimaryAction.vue'
import ShopSecondaryAction from '~/components/platform/shop/admin/ShopSecondaryAction.vue'
import ShopSectionTitle from '~/components/platform/shop/admin/ShopSectionTitle.vue'
import ShopOrdersTable from '~/components/platform/shop/ShopOrdersTable.vue'
import { shopOrders, type ShopOrderStatus } from '~/data/shop-orders'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))

const search = ref('')
const selectedStatuses = ref<ShopOrderStatus[]>([])

const availableStatuses: { label: string, value: ShopOrderStatus }[] = [
  { label: 'Paid', value: 'paid' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Canceled', value: 'canceled' },
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

const exportToCsv = () => {
  const headers = ['Order', 'Customer', 'Email', 'Status', 'Date', 'Items', 'Revenue']
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
  link.setAttribute('download', 'shop-orders.csv')
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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

    <section class="d-flex flex-column ga-4">
      <ShopSectionTitle title="Orders" subtitle="Manage orders, refunds and cancellations.">
        <template #actions>
          <ShopPrimaryAction prepend-icon="mdi-plus">New order</ShopPrimaryAction>

          <v-menu location="bottom end">
            <template #activator="{ props }">
              <ShopSecondaryAction v-bind="props" prepend-icon="mdi-filter-variant">Filters</ShopSecondaryAction>
            </template>

            <v-card min-width="260" rounded="lg">
              <v-list>
                <v-list-subheader>Status</v-list-subheader>
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

          <ShopSecondaryAction prepend-icon="mdi-file-delimited-outline" @click="exportToCsv">Export CSV</ShopSecondaryAction>
        </template>
      </ShopSectionTitle>

      <v-text-field
        v-model="search"
        label="Search orders"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
      />

      <ShopOrdersTable :orders="filteredOrders" :platform-slug="slug" />
    </section>
  </PlatformSplitLayout>
</template>
