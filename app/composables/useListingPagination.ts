import type { MaybeRefOrGetter, Ref } from 'vue'

const LISTING_ITEMS_PER_PAGE = 4

export const useListingPagination = <T>(
  items: MaybeRefOrGetter<T[]>,
  resetTriggers: Array<MaybeRefOrGetter<unknown>> = [],
) => {
  const page = ref(1)
  const itemsPerPage = LISTING_ITEMS_PER_PAGE
  const resolvedItems = computed(() => toValue(items))

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * itemsPerPage
    const end = page.value * itemsPerPage
    return resolvedItems.value.slice(start, end)
  })

  const pageLength = computed(() => Math.max(1, Math.ceil(resolvedItems.value.length / itemsPerPage)))
  const shouldShowPagination = computed(() => resolvedItems.value.length > itemsPerPage)

  watch(
    [resolvedItems, ...resetTriggers.map(trigger => computed(() => toValue(trigger)))],
    () => {
      page.value = 1
    },
  )

  watch(pageLength, (nextLength) => {
    if (page.value > nextLength) {
      page.value = nextLength
    }
  })

  return {
    page,
    itemsPerPage,
    paginatedItems: paginatedItems as Ref<T[]>,
    pageLength,
    shouldShowPagination,
  }
}
