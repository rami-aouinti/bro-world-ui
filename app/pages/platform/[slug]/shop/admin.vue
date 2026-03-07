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
      <UiLoadingState v-if="checkingAccess" class="platform-shop-admin-state" variant="spinner" message="Chargement des permissions admin…" />
      <UiStateAlert v-else-if="accessDenied" type="error" class="mb-4 platform-shop-admin-state">
        Accès refusé à l’espace admin Shop. Redirection en cours…
      </UiStateAlert>
      <UiEmptyState
        v-else-if="shopProducts.length === 0"
        class="platform-shop-admin-state"
        icon="mdi-package-variant-closed-remove"
        title="Aucun élément"
        description="Les cartes d'administration apparaîtront ici dès que les données seront disponibles."
      />
      <template v-else>
        <h1 class="text-h5 font-weight-bold mb-4 text-capitalize platform-shop-admin-title" :aria-label="`Section ${page}`">{{ page }}</h1>
        <v-row>
          <v-col v-for="(product, i) in shopProducts.slice(0, 5)" :key="product.slug" cols="12" md="6" lg="4">
            <v-card rounded="xl" variant="outlined">
              <v-card-text>
                <p class="font-weight-bold">{{ page === 'orders' ? `Order #10${i + 1}` : product.title }}</p>
                <p class="text-body-2 text-medium-emphasis">
                  {{ page === 'payment' ? 'Paiement sécurisé multi-provider prêt à brancher.' : page === 'checkout' ? 'Résumé panier + adresses + livraison.' : 'Suivi de commandes, statuts et retours.' }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </section>
  </PlatformSplitLayout>
</template>
