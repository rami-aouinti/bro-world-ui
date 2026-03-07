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
      <v-btn variant="outlined" block :to="`/platform/${slug}/shop/checkout`">Checkout</v-btn>
    </template>

    <template #default>
      <UiSectionHeader title="Paiement" subtitle="Sécuriser la transaction" />
      <UiCard>
        <v-text-field label="Numéro de carte" />
        <v-row>
          <v-col cols="6"><v-text-field label="Expiration" /></v-col>
          <v-col cols="6"><v-text-field label="CVV" /></v-col>
        </v-row>
        <v-btn color="primary">Payer maintenant</v-btn>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
