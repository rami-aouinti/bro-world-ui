import { defineStore } from 'pinia'
import { usePlatformsApi } from '~/composables/api/usePlatformsApi'
import type { UUID } from '~/types/api/common'
import type {
  CreatePlatformPayload,
  PatchPlatformPayload,
  PlatformRead,
  UpdatePlatformPayload,
} from '~/types/api/platform'

export const usePlatformsStore = defineStore('platforms', () => {
  const platformsApi = usePlatformsApi()
  const items = ref<PlatformRead[]>([])
  const count = ref<number | null>(null)

  const fetchAll = async () => {
    const [listResponse, countResponse] = await Promise.all([
      platformsApi.list({ limit: 200 }),
      platformsApi.count(),
    ])

    items.value = Array.isArray(listResponse) ? listResponse : (listResponse.results ?? [])
    count.value = countResponse.count
    return items.value
  }

  const create = async (payload: CreatePlatformPayload) => {
    const created = await platformsApi.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: UpdatePlatformPayload) => {
    const updated = await platformsApi.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: PatchPlatformPayload) => {
    const patched = await platformsApi.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await platformsApi.delete(id)
    await fetchAll()
  }

  return {
    items,
    count,
    fetchAll,
    create,
    update,
    patch,
    remove,
    getById: platformsApi.getById,
  }
})
