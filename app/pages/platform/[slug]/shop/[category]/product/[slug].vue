<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slugParam = computed(() => route.params.slug)
const platformSlug = computed(() => Array.isArray(slugParam.value) ? String(slugParam.value[0] ?? '') : String(slugParam.value ?? ''))
const category = computed(() => String(route.params.category ?? ''))
const productSlug = computed(() => Array.isArray(slugParam.value) ? String(slugParam.value[1] ?? '') : String(slugParam.value ?? ''))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Shop" :subtitle="`Application ${platformSlug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="`/platform/${platformSlug}/shop/${category}/products`">Retour produits</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="`/platform/${platformSlug}/shop/checkout`">Checkout</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader :title="`Produit: ${productSlug}`" :subtitle="`Catégorie ${category}`" />
      <UiCard title="Détails produit">
        <v-row>
          <v-col cols="12" md="8">
            <p class="text-body-1 mb-2">Description détaillée du produit, bénéfices client et éléments de différenciation.</p>
            <v-chip color="primary" variant="tonal">Stock: 42</v-chip>
          </v-col>
          <v-col cols="12" md="4" class="d-flex flex-column ga-2">
            <v-btn color="primary">Ajouter au panier</v-btn>
            <v-btn variant="outlined" :to="`/platform/${platformSlug}/shop/payment`">Paiement rapide</v-btn>
          </v-col>
        </v-row>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
