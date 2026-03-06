import { defineStore } from 'pinia'
import { useUserGroupsApi } from '~/composables/api/useUserGroupsApi'
import type { UUID } from '~/types/api/common'
import type { CreateUserGroupPayload, PatchUserGroupPayload, UpdateUserGroupPayload, UserGroup } from '~/types/api/userGroup'

export const useUserGroupsStore = defineStore('user-groups', () => {
  const userGroupsApi = useUserGroupsApi()
  const items = ref<UserGroup[]>([])

  const fetchAll = async () => {
    const response = await userGroupsApi.list({ limit: 200 })
    items.value = Array.isArray(response) ? response : (response.results ?? [])
    return items.value
  }

  const create = async (payload: CreateUserGroupPayload) => {
    const created = await userGroupsApi.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: UpdateUserGroupPayload) => {
    const updated = await userGroupsApi.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: PatchUserGroupPayload) => {
    const patched = await userGroupsApi.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await userGroupsApi.delete(id)
    await fetchAll()
  }

  return {
    items,
    fetchAll,
    create,
    update,
    patch,
    remove,
    getById: userGroupsApi.getById,
    getUsers: userGroupsApi.getUsers,
    attachUser: userGroupsApi.attachUser,
    detachUser: userGroupsApi.detachUser,
  }
})
