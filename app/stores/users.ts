import { defineStore } from 'pinia'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { CreateUserPayload, PatchUserPayload, UpdateUserPayload, UserRead } from '~/types/api/user'
import type { UserGroup } from '~/types/api/userGroup'
import type { UUID } from '~/types/api/common'

export const useUsersStore = defineStore('users', () => {
  const usersApi = useUsersApi()
  const items = ref<UserRead[]>([])
  const relations = ref<Record<string, { roles: string[]; groups: UserGroup[] }>>({})

  const fetchAll = async () => {
    items.value = await usersApi.list({ limit: 200 })
    const allRelations = await Promise.all(items.value.map(async (user) => {
      const [roles, groups] = await Promise.all([
        usersApi.getRoles(user.id).catch(() => []),
        usersApi.getGroups(user.id).catch(() => []),
      ])

      return [user.id, { roles, groups }] as const
    }))

    relations.value = Object.fromEntries(allRelations)
    return items.value
  }

  const create = async (payload: CreateUserPayload) => {
    const created = await usersApi.create(payload)
    await fetchAll()
    return created
  }

  const update = async (id: UUID, payload: UpdateUserPayload) => {
    const updated = await usersApi.update(id, payload)
    await fetchAll()
    return updated
  }

  const patch = async (id: UUID, payload: PatchUserPayload) => {
    const patched = await usersApi.patch(id, payload)
    await fetchAll()
    return patched
  }

  const remove = async (id: UUID) => {
    await usersApi.delete(id)
    await fetchAll()
  }

  return {
    items,
    relations,
    fetchAll,
    create,
    update,
    patch,
    remove,
    getById: usersApi.getById,
    getRoles: usersApi.getRoles,
    getGroups: usersApi.getGroups,
    attachGroup: usersApi.attachGroup,
    detachGroup: usersApi.detachGroup,
  }
})
