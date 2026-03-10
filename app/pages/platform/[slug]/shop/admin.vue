<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { shopProducts } from '~/data/platform-demo'
import { getShopNav } from '~/data/platform-nav'
import UiEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiLoadingState from '~/components/ui/state/UiLoadingState.vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const page = computed(() => route.path.split('/').pop() || 'home')
const platformPermissions = usePlatformPermissions(slug)
const { isOwner } = platformPermissions
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
const { t } = useI18n()
const accessDenied = ref(false)
const checkingAccess = ref(true)

onMounted(async () => {
  await platformPermissions.resolveApplication()
  checkingAccess.value = false

  if (!platformPermissions.canAccessAdmin.value) {
    accessDenied.value = true

    setTimeout(() => {
      navigateTo(platformPermissions.getDeniedRedirectPath('shop'))
    }, 1200)
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.shop.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section class="platform-shop-admin-page">
      <UiLoadingState
        v-if="checkingAccess"
        class="platform-shop-admin-state"
        variant="spinner"
        :message="t('platform.shop.admin.messages.loadingPermissions')"
      />
      <UiStateAlert v-else-if="accessDenied" type="error" class="mb-4 platform-shop-admin-state">
        {{ t('platform.shop.admin.messages.accessDeniedRedirect') }}
      </UiStateAlert>
      <UiEmptyState
        v-else-if="shopProducts.length === 0"
        class="platform-shop-admin-state"
        icon="mdi-package-variant-closed-remove"
        :title="t('platform.shop.admin.empty.title')"
        :description="t('platform.shop.admin.empty.description')"
      />
      <template v-else>
        <h1
          class="text-h5 font-weight-bold mb-4 text-capitalize platform-shop-admin-title"
          :aria-label="t('platform.shop.admin.labels.sectionAria', { section: page })"
        >
          {{ page }}
        </h1>
        <v-row>
          <v-col v-for="(product, i) in shopProducts.slice(0, 5)" :key="product.slug" cols="12" md="6" lg="4">
            <v-card rounded="xl" variant="outlined">
              <v-card-text>
                <p class="font-weight-bold">{{ page === 'orders' ? t('platform.shop.admin.cards.orderLabel', { index: i + 1 }) : product.title }}</p>
                <p class="text-body-2 text-medium-emphasis">
                  {{ page === 'payment' ? t('platform.shop.checkout.card.paymentDescription') : page === 'checkout' ? t('platform.shop.checkout.card.checkoutDescription') : t('platform.shop.checkout.card.ordersDescription') }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </section>
  </PlatformSplitLayout>
</template>
