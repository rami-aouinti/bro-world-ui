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

    const activeIds = new Set(items.value.map(user => user.id))
    relations.value = Object.fromEntries(
      Object.entries(relations.value).filter(([id]) => activeIds.has(id)),
    )

    return items.value
  }

  const fetchRelations = async (userIds?: UUID[]) => {
    const targetIds = userIds?.length
      ? userIds
      : items.value.map(user => user.id)

    if (!targetIds.length) {
      return relations.value
    }

    const allRelations = await Promise.all(targetIds.map(async (userId) => {
      const [roles, groups] = await Promise.all([
        usersApi.getRoles(userId).catch(() => []),
        usersApi.getGroups(userId).catch(() => []),
      ])

      return [userId, { roles, groups }] as const
    }))

    relations.value = {
      ...relations.value,
      ...Object.fromEntries(allRelations),
    }

    return relations.value
  }

  const create = async (payload: CreateUserPayload) => {
    const created = await usersApi.create(payload)
    await fetchAll()
    await fetchRelations()
    return created
  }

  const update = async (id: UUID, payload: UpdateUserPayload) => {
    const updated = await usersApi.update(id, payload)
    await fetchAll()
    await fetchRelations([id])
    return updated
  }

  const patch = async (id: UUID, payload: PatchUserPayload) => {
    const patched = await usersApi.patch(id, payload)
    await fetchAll()
    await fetchRelations([id])
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
    fetchRelations,
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
