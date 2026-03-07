<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Shop" :subtitle="`Application ${slug}`" dense />
      <v-btn variant="outlined" block :to="`/platform/${slug}/shop/orders`">Orders</v-btn>
    </template>

    <template #default>
      <UiSectionHeader title="Checkout" subtitle="Validation du panier" />
      <UiCard>
        <v-text-field label="Adresse de livraison" />
        <v-text-field label="Code postal" class="mt-2" />
        <v-btn color="primary" class="mt-4" :to="`/platform/${slug}/shop/payment`">Continuer vers paiement</v-btn>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
