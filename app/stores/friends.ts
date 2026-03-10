import { defineStore } from 'pinia'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { UUID } from '~/types/api/common'
import type { UserFriendRead } from '~/types/api/user'

const RELATIONS_TTL_MS = 60_000

type RelationListKey = 'friends' | 'incoming' | 'sent' | 'blocked'

export type FriendshipRelation = 'blocked' | 'friend' | 'incoming_request' | 'sent_request' | 'none'

export const useFriendsStore = defineStore('friends', () => {
  const usersApi = useUsersApi()

  const friends = ref<UserFriendRead[]>([])
  const incomingRequests = ref<UserFriendRead[]>([])
  const sentRequests = ref<UserFriendRead[]>([])
  const blockedUsers = ref<UserFriendRead[]>([])

  const loading = ref(false)
  const actionLoading = ref(false)
  const initialized = ref(false)

  const cacheTimestamps = ref<Record<RelationListKey, number>>({
    friends: 0,
    incoming: 0,
    sent: 0,
    blocked: 0,
  })

  const isFresh = (key: RelationListKey) => Date.now() - cacheTimestamps.value[key] < RELATIONS_TTL_MS

  const fetchFriends = async (force = false) => {
    if (!force && isFresh('friends')) return friends.value
    friends.value = await usersApi.listMyFriends()
    cacheTimestamps.value.friends = Date.now()
    return friends.value
  }

  const fetchIncoming = async (force = false) => {
    if (!force && isFresh('incoming')) return incomingRequests.value
    incomingRequests.value = await usersApi.listMyFriendRequests()
    cacheTimestamps.value.incoming = Date.now()
    return incomingRequests.value
  }

  const fetchSent = async (force = false) => {
    if (!force && isFresh('sent')) return sentRequests.value
    sentRequests.value = await usersApi.listMySentFriendRequests()
    cacheTimestamps.value.sent = Date.now()
    return sentRequests.value
  }

  const fetchBlocked = async (force = false) => {
    if (!force && isFresh('blocked')) return blockedUsers.value
    blockedUsers.value = await usersApi.listMyBlockedUsers()
    cacheTimestamps.value.blocked = Date.now()
    return blockedUsers.value
  }

  const fetchAll = async (force = false) => {
    loading.value = true
    try {
      await Promise.all([
        fetchFriends(force),
        fetchIncoming(force),
        fetchSent(force),
        fetchBlocked(force),
      ])
      initialized.value = true
    }
    finally {
      loading.value = false
    }
  }

  const invalidateCache = (clearLists = false) => {
    cacheTimestamps.value = { friends: 0, incoming: 0, sent: 0, blocked: 0 }

    if (clearLists) {
      friends.value = []
      incomingRequests.value = []
      sentRequests.value = []
      blockedUsers.value = []
    }
  }

  const refreshAfterAction = async () => {
    invalidateCache(true)
    await fetchAll(true)
  }

  const runAction = async (action: () => Promise<void>) => {
    actionLoading.value = true
    try {
      await action()
      await refreshAfterAction()
    }
    finally {
      actionLoading.value = false
    }
  }

  const sendRequest = (userId: UUID) => runAction(() => usersApi.sendFriendRequest(userId))
  const cancelSentRequest = (userId: UUID) => runAction(() => usersApi.cancelSentFriendRequest(userId))
  const acceptRequest = (userId: UUID) => runAction(() => usersApi.acceptFriendRequest(userId))
  const rejectRequest = (userId: UUID) => runAction(() => usersApi.rejectFriendRequest(userId))
  const removeFriend = (userId: UUID) => runAction(() => usersApi.rejectFriendRequest(userId))
  const blockUser = (userId: UUID) => runAction(() => usersApi.blockUser(userId))
  const unblockUser = (userId: UUID) => runAction(() => usersApi.unblockUser(userId))

  const findUserIdByUsername = (username: string): UUID | null => {
    const normalized = username.trim().toLowerCase()
    if (!normalized) return null

    const allUsers = [
      ...friends.value,
      ...incomingRequests.value,
      ...sentRequests.value,
      ...blockedUsers.value,
    ]

    const user = allUsers.find(item => item.username.trim().toLowerCase() === normalized)
    return user?.id ?? null
  }

  const isUsernameInList = (list: UserFriendRead[], username: string) => {
    const normalized = username.trim().toLowerCase()
    return list.some(user => user.username.trim().toLowerCase() === normalized)
  }

  const relationForUsername = (username: string): FriendshipRelation => {
    if (!username.trim()) return 'none'
    if (isUsernameInList(blockedUsers.value, username)) return 'blocked'
    if (isUsernameInList(friends.value, username)) return 'friend'
    if (isUsernameInList(incomingRequests.value, username)) return 'incoming_request'
    if (isUsernameInList(sentRequests.value, username)) return 'sent_request'
    return 'none'
  }

  return {
    friends,
    incomingRequests,
    sentRequests,
    blockedUsers,
    loading,
    actionLoading,
    initialized,
    fetchAll,
    invalidateCache,
    sendRequest,
    cancelSentRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    unblockUser,
    findUserIdByUsername,
    relationForUsername,
  }
})
