import { defineStore } from 'pinia'
import type { UUID } from '~/types/api/common'
import type { PageEntityRead } from '~/types/api/page'
import {
  useAboutPageManagementApi,
  useContactPageManagementApi,
  useFaqPageManagementApi,
  useHomePageManagementApi,
} from '~/composables/api/usePageApi'

const createPageManagementStore = (
  name: string,
  apiFactory: () => ReturnType<typeof useHomePageManagementApi>,
) => defineStore(name, () => {
  const api = apiFactory()
  const items = ref<PageEntityRead[]>([])
  const count = ref<number | null>(null)
  const isLoading = ref(false)

  const fetchAll = async () => {
    isLoading.value = true
    try {
      const [listResponse, countResponse] = await Promise.all([api.list({ limit: 200 }), api.count()])
      items.value = Array.isArray(listResponse) ? listResponse : (listResponse.results ?? [])
      count.value = countResponse.count
      return items.value
    }
    finally {
      isLoading.value = false
    }
  }

  const create = async (payload: Record<string, unknown>) => {
    const created = await api.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: Record<string, unknown>) => {
    const updated = await api.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: Record<string, unknown>) => {
    const patched = await api.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await api.delete(id)
    await fetchAll()
  }

  return {
    items,
    count,
    isLoading,
    fetchAll,
    create,
    update,
    patch,
    remove,
    getById: api.getById,
  }
})

export const useHomePageManagementStore = createPageManagementStore('home-page-management', useHomePageManagementApi)
export const useAboutPageManagementStore = createPageManagementStore('about-page-management', useAboutPageManagementApi)
export const useContactPageManagementStore = createPageManagementStore('contact-page-management', useContactPageManagementApi)
export const useFaqPageManagementStore = createPageManagementStore('faq-page-management', useFaqPageManagementApi)

