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
        title="Platform CRM Admin"
        :subtitle="`Zone d'administration pour l'application ${slug} sur CRM`"
      />
    </template>

    <div class="d-flex flex-wrap ga-3">
      <v-chip color="primary" variant="tonal">Application: {{ slug }}</v-chip>
      <v-btn variant="outlined" :to="`/platform/${slug}/crm/home`">Retour Home</v-btn>
      <v-btn variant="text" to="/platform">Retour liste</v-btn>
    </div>
  </UiPageSection>
</template>
