import type { RecruitContractType, RecruitJob } from '~/data/platform/recruit'

interface RecruitJobsApiResponse {
  jobs?: RecruitJob[]
  items?: RecruitJob[]
  pagination?: {
    page?: number
    limit?: number
    totalItems?: number
    totalPages?: number
  }
  count?: number
  results?: RecruitJob[]
  next?: string | null
  previous?: string | null
}

export type RecruitHomeFilters = {
  company: string
  salaryMin: number
  salaryMax: number
  contractType: RecruitContractType | ''
  workMode: RecruitJob['workMode'] | ''
  schedule: string
  postedAtLabel: string
  location: string
  q: string
}

export type RecruitUpdateJobPayload = {
  title: string
  location: string
  missionTitle: string
  missionDescription: string
  contractType: RecruitContractType
  workMode: RecruitJob['workMode']
  schedule: string
  summary: string
  responsibilities: string
  profile: string
  benefits: string
}

const DEFAULT_PAGE_SIZE = 3
const PRIVATE_JOBS_TIMEOUT_MS = 6000
const RECRUIT_HOME_CACHE_TTL_MS = 60_000

const emptyFilters = (): RecruitHomeFilters => ({
  company: '',
  salaryMin: 0,
  salaryMax: 0,
  contractType: '',
  workMode: '',
  schedule: '',
  postedAtLabel: '',
  location: '',
  q: '',
})

const createEmptyJobForm = (): RecruitUpdateJobPayload => ({
  title: '',
  location: '',
  missionTitle: '',
  missionDescription: '',
  contractType: 'CDI',
  workMode: 'Onsite',
  schedule: 'Vollzeit',
  summary: '',
  responsibilities: '',
  profile: '',
  benefits: '',
})

const createEmptyApplyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  coverLetter: '',
})

const createEmptyResumeForm = () => ({
  title: '',
  description: '',
  skillTitle: '',
  skillDescription: '',
})

type RecruitHomeJobsCacheEntry = {
  data: { jobs: RecruitJob[], total: number }
  cachedAt: number
}

export const useRecruitHome = () => {
  const route = useRoute()
  const slug = computed(() => String(route.params.slug ?? ''))
  const applicationSlug = computed(() => slug.value)
  const applicationId = computed(() => String(route.query.applicationId ?? slug.value))

  const { initSession, isAuthenticated } = useAuth()
  const { apiFetch } = useApiClient()
  const authSession = useAuthSessionStore()
  const resumesStore = useRecruitResumesStore()

  const currentPage = ref(1)
  const filters = ref<RecruitHomeFilters>(emptyFilters())
  const jobsCache = useState<Record<string, RecruitHomeJobsCacheEntry>>('recruit-home-jobs-cache', () => ({}))

  const createDialog = ref(false)
  const editDialog = ref(false)
  const deleteDialog = ref(false)
  const applyDialog = ref(false)

  const createLoading = ref(false)
  const editLoading = ref(false)
  const deleteLoading = ref(false)
  const applyLoading = ref(false)

  const ownerActionError = ref('')
  const applyError = ref('')

  const selectedJob = ref<RecruitJob | null>(null)
  const selectedApplyJob = ref<RecruitJob | null>(null)

  const createForm = ref<RecruitUpdateJobPayload>(createEmptyJobForm())
  const editForm = ref<RecruitUpdateJobPayload>(createEmptyJobForm())
  const applyForm = ref(createEmptyApplyForm())

  const selectedResumeId = ref('')
  const resumeMode = ref<'existing' | 'new' | 'pdf'>('existing')
  const resumeForm = ref(createEmptyResumeForm())
  const resumeSaving = ref(false)
  const resumeDeleting = ref(false)
  const uploadedResumeFile = ref<File | null>(null)

  const hasFilters = computed(() => Object.values(filters.value).some((value) => {
    if (typeof value === 'number') {
      return value > 0
    }

    return value.trim() !== ''
  }))

  const filterQuery = computed(() => ({
    company: filters.value.company.trim(),
    salaryMin: Math.max(0, Number(filters.value.salaryMin) || 0),
    salaryMax: Math.max(0, Number(filters.value.salaryMax) || 0),
    contractType: filters.value.contractType,
    workMode: filters.value.workMode,
    schedule: filters.value.schedule.trim(),
    postedAtLabel: filters.value.postedAtLabel.trim(),
    location: filters.value.location.trim(),
    q: filters.value.q.trim(),
  }))

  const filterQueryKey = computed(() => JSON.stringify(filterQuery.value))

  const selectedResume = computed(() => resumesStore.items.find(item => item.id === selectedResumeId.value) ?? null)

  watch(selectedResumeId, (nextId) => {
    if (!nextId) {
      return
    }

    const resume = resumesStore.items.find(item => item.id === nextId)
    if (!resume) {
      return
    }

    if (!resume.experiences.length) {
      resume.experiences = [{ id: '', title: '', description: '' }]
    }

    if (!resume.skills.length) {
      resume.skills = [{ id: '', title: '', description: '' }]
    }
  })

  watch(filterQueryKey, () => {
    currentPage.value = 1
  })

  const parseMultilineList = (value: string) => value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)

  const loadEditForm = (job: RecruitJob) => {
    editForm.value = {
      title: job.title,
      location: job.location,
      missionTitle: job.missionTitle,
      missionDescription: job.missionDescription,
      contractType: job.contractType,
      workMode: job.workMode,
      schedule: job.schedule,
      summary: job.summary,
      responsibilities: job.responsibilities.join('\n'),
      profile: job.profile.join('\n'),
      benefits: job.benefits.join('\n'),
    }
  }

  const closeOwnerDialogs = () => {
    createDialog.value = false
    editDialog.value = false
    deleteDialog.value = false
    selectedJob.value = null
  }

  const openCreateDialog = () => {
    createForm.value = createEmptyJobForm()
    ownerActionError.value = ''
    createDialog.value = true
  }

  const openEditDialog = (job: RecruitJob) => {
    selectedJob.value = job
    loadEditForm(job)
    ownerActionError.value = ''
    editDialog.value = true
  }

  const openDeleteDialog = (job: RecruitJob) => {
    selectedJob.value = job
    ownerActionError.value = ''
    deleteDialog.value = true
  }

  const openApplyDialog = async (job: RecruitJob) => {
    await initSession()
    const profile = authSession.profile

    applyForm.value = {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      email: profile?.email ?? '',
      coverLetter: '',
    }

    await resumesStore.fetchMine({ applicationSlug: applicationSlug.value })
    selectedResumeId.value = resumesStore.items[0]?.id ?? ''
    resumeMode.value = selectedResumeId.value ? 'existing' : 'new'
    uploadedResumeFile.value = null
    resumeForm.value = createEmptyResumeForm()
    applyError.value = ''
    selectedApplyJob.value = job
    applyDialog.value = true
  }

  const closeApplyDialog = () => {
    applyDialog.value = false
    selectedApplyJob.value = null
    applyError.value = ''
    uploadedResumeFile.value = null
  }

  const handleResumeFileChange = (value: File | File[] | null) => {
    uploadedResumeFile.value = Array.isArray(value) ? (value[0] ?? null) : value
  }

  const canSubmitApplication = computed(() => {
    const hasExistingResume = resumeMode.value === 'existing' && Boolean(selectedResumeId.value)
    const hasNewResumeData = resumeMode.value === 'new'
      && resumeForm.value.title.trim()
      && resumeForm.value.description.trim()
    const hasPdfResume = resumeMode.value === 'pdf' && Boolean(uploadedResumeFile.value)

    return Boolean(
      selectedApplyJob.value
      && applyForm.value.coverLetter.trim()
      && (hasExistingResume || hasNewResumeData || hasPdfResume),
    )
  })

  const normalizeJobsResponse = (response: RecruitJobsApiResponse | null) => {
    const items = response?.items ?? response?.jobs ?? response?.results ?? []
    const totalFromPagination = response?.pagination?.totalItems
    const total = typeof totalFromPagination === 'number'
      ? totalFromPagination
      : typeof response?.count === 'number'
        ? response.count
        : items.length

    return { jobs: items, total }
  }

  const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs)
      }),
    ])
  }

  const fetchRecruitJobsPrivate = async () => apiFetch<RecruitJobsApiResponse>(`/api/v1/recruit/applications/${applicationSlug.value}/private/jobs`, {
    method: 'GET',
    query: {
      page: currentPage.value,
      limit: DEFAULT_PAGE_SIZE,
      ...filterQuery.value,
    },
  })

  const fetchRecruitJobsPublic = async () => apiFetch<RecruitJobsApiResponse>(`/api/v1/recruit/applications/${applicationSlug.value}/public/jobs`, {
    method: 'GET',
    query: {
      page: currentPage.value,
      limit: DEFAULT_PAGE_SIZE,
      ...filterQuery.value,
    },
  })

  const getJobsCacheKey = (authScope: 'auth' | 'guest') => `${slug.value}-${authScope}-${currentPage.value}-${filterQueryKey.value}`

  const fetchRecruitJobsWithFallback = async () => {
    await initSession()

    const authScope: 'auth' | 'guest' = isAuthenticated.value ? 'auth' : 'guest'
    const cacheKey = getJobsCacheKey(authScope)
    const now = Date.now()
    const cacheEntry = jobsCache.value[cacheKey]

    if (cacheEntry && now - cacheEntry.cachedAt < RECRUIT_HOME_CACHE_TTL_MS) {
      return cacheEntry.data
    }

    if (isAuthenticated.value) {
      try {
        const privateResponse = await withTimeout(fetchRecruitJobsPrivate(), PRIVATE_JOBS_TIMEOUT_MS)
        const normalized = normalizeJobsResponse(privateResponse)
        jobsCache.value[cacheKey] = { data: normalized, cachedAt: now }
        return normalized
      } catch {
        // fallback sur l'endpoint public si le private échoue ou tarde trop
      }
    }

    try {
      const publicResponse = await withTimeout(fetchRecruitJobsPublic(), PRIVATE_JOBS_TIMEOUT_MS)
      const normalized = normalizeJobsResponse(publicResponse)

      if (!isAuthenticated.value) {
        jobsCache.value[cacheKey] = { data: normalized, cachedAt: now }
      }

      return normalized
    } catch {
      return cacheEntry?.data ?? { jobs: [], total: 0 }
    }
  }

  const { data: jobsData, pending, error, refresh, execute: loadJobs } = useAsyncData(
    () => `recruit-home-jobs-${slug.value}-${currentPage.value}-${filterQueryKey.value}`,
    fetchRecruitJobsWithFallback,
    {
      default: () => ({ jobs: [], total: 0 }),
      server: false,
      immediate: false,
    },
  )

  watch(
    () => [slug.value, currentPage.value, filterQueryKey.value],
    () => {
      void loadJobs()
    },
  )

  const totalPages = computed(() => {
    const total = jobsData.value.total
    return total > 0 ? Math.ceil(total / DEFAULT_PAGE_SIZE) : 1
  })

  const resetFilters = () => {
    filters.value = emptyFilters()
    currentPage.value = 1
  }

  const submitCreateJob = async () => {
    createLoading.value = true
    ownerActionError.value = ''

    try {
      await apiFetch(`/api/v1/recruit/applications/${applicationSlug.value}/jobs`, {
        method: 'POST',
        body: {
          title: createForm.value.title.trim(),
          location: createForm.value.location.trim(),
          summary: createForm.value.summary.trim(),
          missionTitle: createForm.value.missionTitle.trim(),
          missionDescription: createForm.value.missionDescription.trim(),
          contractType: createForm.value.contractType,
          workMode: createForm.value.workMode,
          schedule: createForm.value.schedule.trim(),
          responsibilities: parseMultilineList(createForm.value.responsibilities),
          profile: parseMultilineList(createForm.value.profile),
          benefits: parseMultilineList(createForm.value.benefits),
        },
      })

      await refresh()
      closeOwnerDialogs()
      return true
    } catch {
      ownerActionError.value = "La création de l'offre a échoué."
      return false
    } finally {
      createLoading.value = false
    }
  }

  const submitEditJob = async () => {
    if (!selectedJob.value) {
      return
    }

    editLoading.value = true
    ownerActionError.value = ''

    try {
      await apiFetch(`/api/v1/recruit/applications/${applicationId.value}/jobs/${selectedJob.value.id}`, {
        method: 'PATCH',
        body: {
          title: editForm.value.title.trim(),
          location: editForm.value.location.trim(),
          missionTitle: editForm.value.missionTitle.trim(),
          missionDescription: editForm.value.missionDescription.trim(),
          contractType: editForm.value.contractType,
          workMode: editForm.value.workMode,
          schedule: editForm.value.schedule.trim(),
          summary: editForm.value.summary.trim(),
          responsibilities: parseMultilineList(editForm.value.responsibilities),
          profile: parseMultilineList(editForm.value.profile),
          benefits: parseMultilineList(editForm.value.benefits),
        },
      })

      await refresh()
      closeOwnerDialogs()
      return true
    } catch {
      ownerActionError.value = "La mise à jour de l'offre a échoué."
      return false
    } finally {
      editLoading.value = false
    }
  }

  const submitDeleteJob = async () => {
    if (!selectedJob.value) {
      return
    }

    deleteLoading.value = true
    ownerActionError.value = ''

    try {
      await apiFetch(`/api/v1/recruit/applications/${applicationId.value}/jobs/${selectedJob.value.id}`, {
        method: 'DELETE',
      })

      await refresh()
      closeOwnerDialogs()
      return true
    } catch {
      ownerActionError.value = "La suppression de l'offre a échoué."
      return false
    } finally {
      deleteLoading.value = false
    }
  }

  const submitApply = async () => {
    if (!selectedApplyJob.value || !canSubmitApplication.value) {
      return false
    }

    applyLoading.value = true
    applyError.value = ''

    try {
      let resumeId = selectedResumeId.value

      if (resumeMode.value === 'new') {
        const resumeResponse = await resumesStore.create({
          experiences: [{
            title: resumeForm.value.title.trim(),
            description: resumeForm.value.description.trim(),
          }],
          skills: resumeForm.value.skillTitle.trim()
            ? [{
                title: resumeForm.value.skillTitle.trim(),
                description: resumeForm.value.skillDescription.trim(),
              }]
            : [],
        }, applicationSlug.value)
        resumeId = resumeResponse.id
      }

      if (resumeMode.value === 'pdf' && uploadedResumeFile.value) {
        const resumeResponse = await resumesStore.createFromDocument(uploadedResumeFile.value, applicationSlug.value)
        resumeId = resumeResponse.id
      }

      const applicantResponse = await apiFetch<{ id: string }>(`/api/v1/recruit/applications/${applicationSlug.value}/applicants`, {
        method: 'POST',
        body: {
          resumeId,
          coverLetter: applyForm.value.coverLetter.trim(),
        },
      })

      await apiFetch<{ id: string, status: string }>(`/api/v1/recruit/applications/${applicationSlug.value}/applications`, {
        method: 'POST',
        body: {
          applicantId: applicantResponse.id,
          jobId: selectedApplyJob.value.id,
          status: 'WAITING',
        },
      })

      await refresh()
      closeApplyDialog()
      return true
    } catch {
      applyError.value = 'La candidature a échoué. Vérifiez les informations et réessayez.'
      return false
    } finally {
      applyLoading.value = false
    }
  }

  const saveSelectedResume = async () => {
    if (!selectedResume.value) {
      return
    }

    resumeSaving.value = true
    applyError.value = ''

    try {
      await resumesStore.update(selectedResume.value.id, {
        experiences: selectedResume.value.experiences.map(item => ({
          title: item.title.trim(),
          description: item.description.trim(),
        })),
        skills: selectedResume.value.skills.map(item => ({
          title: item.title.trim(),
          description: item.description.trim(),
        })),
      }, applicationSlug.value)
    } catch {
      applyError.value = 'La mise à jour du CV a échoué.'
    } finally {
      resumeSaving.value = false
    }
  }

  const deleteSelectedResume = async () => {
    if (!selectedResume.value) {
      return
    }

    resumeDeleting.value = true
    applyError.value = ''

    try {
      await resumesStore.remove(selectedResume.value.id, applicationSlug.value)
      selectedResumeId.value = resumesStore.items[0]?.id ?? ''
      if (!selectedResumeId.value) {
        resumeMode.value = 'new'
      }
    } catch {
      applyError.value = 'La suppression du CV a échoué.'
    } finally {
      resumeDeleting.value = false
    }
  }

  return {
    slug,
    currentPage,
    filters,
    hasFilters,
    jobsData,
    pending,
    error,
    loadJobs,
    totalPages,
    refresh,
    isAuthenticated,
    resetFilters,
    createDialog,
    editDialog,
    deleteDialog,
    applyDialog,
    createForm,
    editForm,
    applyForm,
    createLoading,
    editLoading,
    deleteLoading,
    applyLoading,
    ownerActionError,
    applyError,
    selectedJob,
    selectedApplyJob,
    resumesStore,
    selectedResumeId,
    selectedResume,
    resumeMode,
    resumeForm,
    resumeSaving,
    resumeDeleting,
    canSubmitApplication,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeOwnerDialogs,
    openApplyDialog,
    closeApplyDialog,
    handleResumeFileChange,
    submitCreateJob,
    submitEditJob,
    submitDeleteJob,
    submitApply,
    saveSelectedResume,
    deleteSelectedResume,
  }
}
