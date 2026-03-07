<script setup lang="ts">
import ClassCard from '~/components/platform/cards/ClassCard.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import { schoolClasses } from '~/data/platform/school'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformApplication(slug)
const loading = ref(true)

const sortedClasses = computed(() =>
  [...schoolClasses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 220)
})
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
      <UiSkeletonCardGrid v-if="loading" :cards="4" />
      <v-row v-else>
        <v-col v-for="classItem in sortedClasses" :key="classItem.id" cols="12" md="6" lg="4">
          <ClassCard :class-item="classItem" />
        </v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
