<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()
const { t } = useI18n({ useScope: 'global' })

const platformId = computed(() => String(route.params.platformId ?? ''))
</script>

<template>
  <UiPageSection max-width="1200" card>
    <template #header>
      <UiSectionHeader
        :title="`Platform Home`"
        :subtitle="`Espace d'accueil pour la platform ${platformId}`"
      />
    </template>

    <v-alert type="info" variant="tonal" class="mb-4">
      {{ t('platform.newPlatform.title') }} - {{ platformId }}
    </v-alert>

    <v-btn color="primary" variant="flat" :to="`/platform/${platformId}/admin`">
      Aller vers Admin
    </v-btn>
  </UiPageSection>
</template>
