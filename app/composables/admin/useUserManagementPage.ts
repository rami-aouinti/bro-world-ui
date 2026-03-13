import { computed, onMounted, reactive, ref } from 'vue'
import { useUsersStore } from '~/stores/users'
import type { UserGroup } from '~/types/api/userGroup'
import type { UserRead, UserWrite } from '~/types/api/user'

type FormMode = 'create' | 'edit' | 'patch'
type TranslateFn = (key: string, params?: Record<string, unknown>) => string

const defaultFormState = (): UserWrite => ({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  language: 'fr',
  locale: 'fr_FR',
  timezone: 'Europe/Paris',
  photo: '',
})

export const useUserManagementPage = (t: TranslateFn) => {
  const usersStore = useUsersStore()
  const loading = computed(() => usersStore.isLoading)
  const submitting = ref(false)
  const errorMessage = ref('')
  const users = ref<UserRead[]>([])
  const search = ref('')

  const formMode = ref<FormMode>('create')
  const formDialog = ref(false)
  const deleteDialog = ref(false)
  const showDialog = ref(false)
  const rolesDialog = ref(false)
  const groupsDialog = ref(false)
  const selectedUser = ref<UserRead | null>(null)
  const userToDeleteId = ref('')
  const selectedUserRoles = ref<string[]>([])
  const selectedUserGroups = ref<UserGroup[]>([])
  const groupToAttach = ref('')
  const userRelations = ref<Record<string, { roles: string[]; groups: UserGroup[] }>>({})

  const form = reactive<UserWrite>(defaultFormState())

  const headers = computed(() => [
    { title: '', key: 'photo', sortable: false },
    { title: t('admin.users.headers.username'), key: 'username', sortable: true },
    { title: t('admin.users.headers.name'), key: 'fullName', sortable: true },
    { title: t('admin.users.headers.email'), key: 'email', sortable: true },
    { title: t('admin.users.headers.relations'), key: 'relations', sortable: false },
    { title: t('admin.users.headers.actions'), key: 'actions', sortable: false },
  ])

  const tableItems = computed(() => users.value.map(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    relations: userRelations.value[user.id] ?? { roles: [], groups: [] },
  })))

  const formTitle = computed(() => {
    if (formMode.value === 'create') {
      return t('admin.users.form.createTitle')
    }

    if (formMode.value === 'edit') {
      return t('admin.users.form.editTitle')
    }

    return t('admin.users.form.patchTitle')
  })

  const fetchUsers = async () => {
    errorMessage.value = ''

    try {
      users.value = await usersStore.fetchAll()
      userRelations.value = { ...usersStore.relations }

      void usersStore.fetchRelations(users.value.map(user => user.id)).then(() => {
        userRelations.value = { ...usersStore.relations }
      })
    }
    catch {
      errorMessage.value = t('admin.users.errors.load')
    }
  }

  const resetForm = () => {
    Object.assign(form, defaultFormState())
  }

  const openCreateDialog = () => {
    formMode.value = 'create'
    resetForm()
    formDialog.value = true
  }

  const openEditDialog = (user: UserRead, patch = false) => {
    formMode.value = patch ? 'patch' : 'edit'
    Object.assign(form, {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      language: user.language ?? 'fr',
      locale: user.locale ?? 'fr_FR',
      timezone: user.timezone,
      photo: user.photo ?? '',
    })
    selectedUser.value = user
    formDialog.value = true
  }

  const showEntity = async (id: string) => {
    selectedUser.value = await usersStore.getById(id)
    showDialog.value = true
  }

  const openRolesDialog = async (user: UserRead) => {
    selectedUser.value = user
    selectedUserRoles.value = await usersStore.getRoles(user.id)
    rolesDialog.value = true
  }

  const openGroupsDialog = async (user: UserRead) => {
    selectedUser.value = user
    selectedUserGroups.value = await usersStore.getGroups(user.id)
    groupsDialog.value = true
  }

  const openDeleteDialog = (id: string) => {
    userToDeleteId.value = id
    deleteDialog.value = true
  }

  const attachGroup = async () => {
    if (!selectedUser.value || !groupToAttach.value.trim()) {
      return
    }

    await usersStore.attachGroup(selectedUser.value.id, groupToAttach.value.trim())
    groupToAttach.value = ''
    selectedUserGroups.value = await usersStore.getGroups(selectedUser.value.id)
  }

  const detachGroup = async (groupId: string) => {
    if (!selectedUser.value) {
      return
    }

    await usersStore.detachGroup(selectedUser.value.id, groupId)
    selectedUserGroups.value = await usersStore.getGroups(selectedUser.value.id)
  }

  const submitForm = async () => {
    if ((formMode.value === 'edit' || formMode.value === 'patch') && !selectedUser.value) {
      return
    }

    submitting.value = true
    try {
      if (formMode.value === 'create') {
        await usersStore.create({ ...form })
      }
      else if (formMode.value === 'edit') {
        await usersStore.update(selectedUser.value!.id, { ...form })
      }
      else {
        await usersStore.patch(selectedUser.value!.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          timezone: form.timezone,
          language: form.language,
          locale: form.locale,
          photo: form.photo,
        })
      }

      formDialog.value = false
      await fetchUsers()
    }
    finally {
      submitting.value = false
    }
  }

  const deleteEntity = async () => {
    if (!userToDeleteId.value) {
      return
    }

    submitting.value = true
    try {
      await usersStore.remove(userToDeleteId.value)
      deleteDialog.value = false
      userToDeleteId.value = ''
      await fetchUsers()
    }
    finally {
      submitting.value = false
    }
  }

  onMounted(async () => {
    await fetchUsers()
  })

  return {
    attachGroup,
    deleteDialog,
    deleteEntity,
    detachGroup,
    errorMessage,
    fetchUsers,
    form,
    formDialog,
    formMode,
    formTitle,
    groupToAttach,
    groupsDialog,
    headers,
    loading,
    openCreateDialog,
    openDeleteDialog,
    openEditDialog,
    openGroupsDialog,
    openRolesDialog,
    rolesDialog,
    search,
    selectedUser,
    selectedUserGroups,
    selectedUserRoles,
    showDialog,
    showEntity,
    submitForm,
    submitting,
    tableItems,
    userToDeleteId,
  }
}
