import { defineStore } from 'pinia'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { UserApplication, UserMeRead, UserMePasswordPayload, UserMeProfilePayload } from '~/types/api/user'

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


  const fetchMyApplications = async (): Promise<UserApplication[]> => {
    return api.listMyApplications()
  }

  const fetchMyLatestApplications = async (): Promise<UserApplication[]> => {
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
    updateProfile,
    updatePassword,
    deleteAccount,
    uploadPhoto,
  }
})
