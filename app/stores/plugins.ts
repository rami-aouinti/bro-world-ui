import { defineStore } from 'pinia'
import { usePluginsApi } from '~/composables/api/usePluginsApi'
import type { UUID } from '~/types/api/common'
import type {
  CreatePluginPayload,
  PatchPluginPayload,
  PluginRead,
  UpdatePluginPayload,
} from '~/types/api/plugin'

export const usePluginsStore = defineStore('plugins', () => {
  const pluginsApi = usePluginsApi()
  const items = ref<PluginRead[]>([])
  const count = ref<number | null>(null)

  const fetchAll = async () => {
    const [listResponse, countResponse] = await Promise.all([
      pluginsApi.list({ limit: 200 }),
      pluginsApi.count(),
    ])

    items.value = Array.isArray(listResponse) ? listResponse : (listResponse.results ?? [])
    count.value = countResponse.count
    return items.value
  }

  const create = async (payload: CreatePluginPayload) => {
    const created = await pluginsApi.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: UpdatePluginPayload) => {
    const updated = await pluginsApi.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: PatchPluginPayload) => {
    const patched = await pluginsApi.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await pluginsApi.delete(id)
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
    getById: pluginsApi.getById,
  }
})
