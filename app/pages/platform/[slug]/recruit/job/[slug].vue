<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slugParam = computed(() => route.params.slug)
const platformSlug = computed(() => Array.isArray(slugParam.value) ? String(slugParam.value[0] ?? '') : String(slugParam.value ?? ''))
const jobSlug = computed(() => Array.isArray(slugParam.value) ? String(slugParam.value[1] ?? '') : String(slugParam.value ?? ''))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="Recruit" :subtitle="`Application ${platformSlug}`" dense />
      <v-btn variant="outlined" block :to="`/platform/${platformSlug}/recruit/home`">Retour jobs</v-btn>
    </template>

    <template #default>
      <UiSectionHeader :title="`Poste: ${jobSlug}`" subtitle="Détail de l'offre" />
      <UiCard title="Description du poste">
        <p class="mb-2">Vous rejoignez une équipe produit transverse avec un fort impact business.</p>
        <v-list density="compact">
          <v-list-item title="Expérience" subtitle="3+ ans" />
          <v-list-item title="Type" subtitle="Temps plein" />
          <v-list-item title="Localisation" subtitle="Hybride" />
        </v-list>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
