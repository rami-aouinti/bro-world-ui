<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const shopPath = (page: string) => `/platform/${slug.value}/shop/${page}`
const { isOwner } = usePlatformApplication(slug)

const categories = ['apparel', 'office', 'electronics']
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Shop" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="shopPath('home')">Home</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="shopPath('orders')">Orders</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="shopPath('checkout')">Checkout</v-btn>
        <v-btn v-if="isOwner" variant="outlined" block class="mt-2" :to="shopPath('admin')">Admin</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Catalogue produits" subtitle="Parcourir les catégories disponibles" />
      <v-row>
        <v-col v-for="category in categories" :key="category" cols="12" md="4">
          <UiListCard>
            <p class="text-subtitle-1 font-weight-medium text-capitalize">{{ category }}</p>
            <v-btn class="mt-2" color="primary" variant="tonal" :to="`/platform/${slug}/shop/${category}/products`">Voir les produits</v-btn>
          </UiListCard>
        </v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
