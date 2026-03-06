import { defineStore } from 'pinia'
import { useConfigurationApi } from '~/composables/api/useConfigurationApi'
import type { UUID } from '~/types/api/common'
import type {
  ConfigurationRead,
  CreateConfigurationPayload,
  PatchConfigurationPayload,
  UpdateConfigurationPayload,
} from '~/types/api/configuration'

export const useConfigurationsStore = defineStore('configurations', () => {
  const configurationsApi = useConfigurationApi()
  const items = ref<ConfigurationRead[]>([])
  const count = ref<number | null>(null)

  const fetchAll = async () => {
    const [listResponse, countResponse] = await Promise.all([
      configurationsApi.list({ limit: 200 }),
      configurationsApi.count(),
    ])

    items.value = Array.isArray(listResponse) ? listResponse : (listResponse.results ?? [])
    count.value = countResponse.count
    return items.value
  }

  const create = async (payload: CreateConfigurationPayload) => {
    const created = await configurationsApi.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: UpdateConfigurationPayload) => {
    const updated = await configurationsApi.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: PatchConfigurationPayload) => {
    const patched = await configurationsApi.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await configurationsApi.delete(id)
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
    getById: configurationsApi.getById,
  }
})
