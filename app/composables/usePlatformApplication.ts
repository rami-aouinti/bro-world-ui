import { toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

const normalizeSlug = (value: unknown) => {
  if (Array.isArray(value)) {
    return String(value[0] ?? '')
  }

  return String(value ?? '')
}

export const usePlatformApplication = (slugInput: MaybeRefOrGetter<string>) => {
  const applicationsStore = useApplicationsStore()

  const slug = computed(() => normalizeSlug(toValue(slugInput)).trim())

  const application = computed(() => {
    const currentSlug = slug.value

    if (!currentSlug) {
      return undefined
    }

    return applicationsStore.items.find(item => item.slug === currentSlug || item.id === currentSlug)
  })

  const isOwner = computed(() => application.value?.isOwner === true)

  const resolveApplication = async () => {
    const currentSlug = slug.value

    if (!currentSlug) {
      return undefined
    }

    if (application.value) {
      return application.value
    }

    const pageSize = 50
    let page = 1

    while (true) {
      const items = await applicationsStore.fetch({
        page,
        limit: pageSize,
        filters: {
          ...applicationsStore.filters,
          search: currentSlug,
        },
      })

      const matched = items.find(item => item.slug === currentSlug || item.id === currentSlug)

      if (matched) {
        return matched
      }

      if (page >= applicationsStore.pagination.totalPages) {
        return undefined
      }

      page += 1
    }
  }

  return {
    slug,
    application,
    isOwner,
    resolveApplication,
  }
}
