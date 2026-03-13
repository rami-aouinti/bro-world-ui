import { defineStore } from 'pinia'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { UserApplication, UserFriendRead, UserMeRead, UserMePasswordPayload, UserMeProfilePayload } from '~/types/api/user'

export const useCurrentUserStore = defineStore('current-user', () => {
  const api = useUsersApi()

  const me = ref<UserMeRead | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const displayName = computed(() => {
    if (!me.value) return 'Guest User'
    return `${me.value.firstName} ${me.value.lastName}`.trim()
  })

  const fetchMe = async (force = false) => {
    if (initialized.value && !force) return me.value

    loading.value = true
    try {
      me.value = await api.getMe()
      initialized.value = true
      return me.value
    }
    finally {
      loading.value = false
    }
  }



  const getMyApplicationsFromProfile = (): UserApplication[] => {
    return me.value?.applications ?? []
  }

  const getMyLatestApplicationsFromProfile = (): UserApplication[] => {
    const applications = getMyApplicationsFromProfile()
    return [...applications]
      .sort((left, right) => {
        const leftDate = Date.parse(left.updatedAt || left.createdAt || '') || 0
        const rightDate = Date.parse(right.updatedAt || right.createdAt || '') || 0
        return rightDate - leftDate
      })
      .slice(0, 6)
  }

  const getMyFriendsFromProfile = (): UserFriendRead[] => me.value?.friends ?? []
  const getMyIncomingRequestsFromProfile = (): UserFriendRead[] => me.value?.incomingRequests ?? []
  const getMySentRequestsFromProfile = (): UserFriendRead[] => me.value?.friendRequests ?? []
  const getMyBlockedUsersFromProfile = (): UserFriendRead[] => me.value?.blockedUsers ?? []

  const fetchMyApplications = async (): Promise<UserApplication[]> => {
    if (!initialized.value || !me.value) await fetchMe(true)
    const fromProfile = getMyApplicationsFromProfile()
    if (fromProfile.length) return fromProfile
    return api.listMyApplications()
  }

  const fetchMyLatestApplications = async (): Promise<UserApplication[]> => {
    if (!initialized.value || !me.value) await fetchMe(true)
    const fromProfile = getMyLatestApplicationsFromProfile()
    if (fromProfile.length) return fromProfile
    return api.listMyLatestApplications()
  }

  const updateProfile = async (payload: UserMeProfilePayload) => {
    const updated = await api.updateMyProfile(payload)
    me.value = updated
    initialized.value = true
    return updated
  }

  const updatePassword = async (payload: UserMePasswordPayload) => {
    await api.updateMyPassword(payload)
  }

  const deleteAccount = async () => {
    await api.deleteMe()
    me.value = null
    initialized.value = false
  }

  const uploadPhoto = async (photo: File) => {
    const response = await api.uploadMyPhoto(photo)
    if (me.value) {
      me.value = {
        ...me.value,
        photo: response.photo,
      }
    }

    return response
  }

  return {
    me,
    loading,
    initialized,
    displayName,
    fetchMe,
    fetchMyApplications,
    fetchMyLatestApplications,
    getMyFriendsFromProfile,
    getMyIncomingRequestsFromProfile,
    getMySentRequestsFromProfile,
    getMyBlockedUsersFromProfile,
    updateProfile,
    updatePassword,
    deleteAccount,
    uploadPhoto,
  }
})
