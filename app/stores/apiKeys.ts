import { defineStore } from 'pinia'
import { useApiKeysApi } from '~/composables/api/useApiKeysApi'
import type { UUID } from '~/types/api/common'
import type { ApiKey, CreateApiKeyPayload, PatchApiKeyPayload, UpdateApiKeyPayload } from '~/types/api/apiKey'

export const useApiKeysStore = defineStore('api-keys', () => {
  const apiKeysApi = useApiKeysApi()
  const version = ref<'v1' | 'v2'>('v1')
  const items = ref<ApiKey[]>([])

  const client = computed(() => apiKeysApi[version.value])

  const fetchAll = async () => {
    const response = await client.value.list({ limit: 200 })
    items.value = Array.isArray(response) ? response : (response.results ?? [])
    return items.value
  }

  const create = async (payload: CreateApiKeyPayload) => {
    const created = await client.value.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: UpdateApiKeyPayload) => {
    const updated = await client.value.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: PatchApiKeyPayload) => {
    const patched = await client.value.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await client.value.delete(id)
    await fetchAll()
  }

  return {
    version,
    items,
    fetchAll,
    create,
    update,
    patch,
    remove,
    getById: (id: UUID) => client.value.getById(id),
  }
})
