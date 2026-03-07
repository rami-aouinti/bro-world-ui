<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformApplication(slug)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="School" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="`/platform/${slug}/school/home`">Classes</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="`/platform/${slug}/school/settings`">Settings</v-btn>
        <v-btn v-if="isOwner" variant="outlined" block class="mt-2" :to="`/platform/${slug}/school/admin`">Admin</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Classes" subtitle="Programme en cours" />
      <v-row>
        <v-col cols="12" md="4"><UiListCard><p class="font-weight-medium">Classe A</p><p class="text-body-2">24 élèves · Niveau 1</p></UiListCard></v-col>
        <v-col cols="12" md="4"><UiListCard><p class="font-weight-medium">Classe B</p><p class="text-body-2">19 élèves · Niveau 2</p></UiListCard></v-col>
        <v-col cols="12" md="4"><UiListCard><p class="font-weight-medium">Classe C</p><p class="text-body-2">21 élèves · Niveau 3</p></UiListCard></v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
