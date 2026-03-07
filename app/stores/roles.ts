import { defineStore } from 'pinia'
import { useRolesApi } from '~/composables/api/useRolesApi'
import type { UUID } from '~/types/api/common'
import type { CreateRolePayload, PatchRolePayload, Role, UpdateRolePayload } from '~/types/api/role'

export const useRolesStore = defineStore('roles', () => {
  const rolesApi = useRolesApi()
  const items = ref<Role[]>([])
  const count = ref<number | null>(null)
  const isLoading = ref(false)

  const fetchAll = async () => {
    isLoading.value = true

    try {
      const [listResponse, countResponse] = await Promise.all([
        rolesApi.list({ limit: 200 }),
        rolesApi.count(),
      ])

      items.value = Array.isArray(listResponse) ? listResponse : (listResponse.results ?? [])
      count.value = countResponse.count
      return items.value
    }
    finally {
      isLoading.value = false
    }
  }

  const create = async (payload: CreateRolePayload) => {
    const created = await rolesApi.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: UpdateRolePayload) => {
    const updated = await rolesApi.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: PatchRolePayload) => {
    const patched = await rolesApi.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await rolesApi.delete(id)
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
    getById: rolesApi.getById,
    inherited: rolesApi.inherited,
  }
})
