<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()

const slug = computed(() => String(route.params.slug ?? ''))

const homePath = computed(() => `/platform/${slug.value}/crm/home`)
const adminPath = computed(() => `/platform/${slug.value}/crm/admin`)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader
        title="CRM"
        :subtitle="`Application ${slug}`"
      />

      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="homePath">Home</v-btn>
      <v-btn variant="outlined" block :to="adminPath" class="mt-2">Admin</v-btn>
      <v-btn variant="text" block class="mt-2" to="/platform">Retour liste</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader
        title="Platform CRM Home"
        :subtitle="`Espace d'accueil pour l'application ${slug} sur CRM`"
      />

    <v-alert type="info" variant="tonal" class="mb-4">
      Application: {{ slug }}
    </v-alert>

    <v-btn color="primary" variant="flat" :to="adminPath">
      Aller vers Admin
    </v-btn>
    </template>
  </PlatformSplitLayout>
</template>
