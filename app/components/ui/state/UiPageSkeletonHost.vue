<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiDashboardPageSkeleton from '~/components/ui/state/UiDashboardPageSkeleton.vue'
import UiDefaultPageSkeleton from '~/components/ui/state/UiDefaultPageSkeleton.vue'

const props = withDefaults(defineProps<{
  loading?: boolean
  skeletonKey?: string
}>(), {
  loading: false,
  skeletonKey: '',
})

const emit = defineEmits<{
  'update:loading': [value: boolean]
  'update:skeletonKey': [value: string]
}>()

const route = useRoute()
const suspensePending = ref(false)
const activeSkeletonKey = ref(props.skeletonKey)

const skeletonComponents: Record<string, unknown> = {
  dashboard: UiDashboardPageSkeleton,
}

const resolvedSkeleton = computed(() => skeletonComponents[activeSkeletonKey.value] ?? UiDefaultPageSkeleton)
const mergedLoading = computed(() => props.loading || suspensePending.value)

watch(
  () => route.meta?.skeleton,
  (value) => {
    activeSkeletonKey.value = typeof value === 'string' ? value : ''
  },
  { immediate: true },
)

watch(mergedLoading, (value) => {
  emit('update:loading', value)
}, { immediate: true })

watch(activeSkeletonKey, (value) => {
  emit('update:skeletonKey', value)
}, { immediate: true })
</script>

<template>
  <NuxtPage v-slot="{ Component }">
    <Suspense
      @pending="() => { suspensePending = true }"
      @resolve="() => { suspensePending = false }"
    >
      <component :is="Component" v-if="Component" />

      <template #fallback>
        <component :is="resolvedSkeleton" />
      </template>
    </Suspense>
  </NuxtPage>
</template>
