<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()

const slug = computed(() => String(route.params.slug ?? ''))
</script>

<template>
  <UiPageSection max-width="1200" card>
    <template #header>
      <UiSectionHeader
        title="Platform School Home"
        :subtitle="`Espace d'accueil pour l'application ${slug} sur School`"
      />
    </template>

    <v-alert type="info" variant="tonal" class="mb-4">
      Application: {{ slug }}
    </v-alert>

    <v-btn color="primary" variant="flat" :to="`/platform/${slug}/school/admin`">
      Aller vers Admin
    </v-btn>
  </UiPageSection>
</template>
