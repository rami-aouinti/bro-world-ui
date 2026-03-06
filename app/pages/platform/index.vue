<script setup lang="ts">
import UiPageSection from "~/components/ui/UiPageSection.vue";
import UserIdentity from '~/components/UserIdentity.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const { isAuthenticated, initSession } = useAuth()
const applicationsStore = useApplicationsStore()
const authSession = useAuthSessionStore()

const editDialog = ref(false)
const deleteDialog = ref(false)
const submitting = ref(false)
const selectedApp = ref<(typeof applicationsStore.items.value)[number] | null>(null)

await initSession()
await useAsyncData('platform-applications', () => applicationsStore.fetch())

const goToNewPlatform = () => {
  if (isAuthenticated.value) {
    router.push('/platform/new')
    return
  }

  router.push('/login')
}

const formatDate = (value?: string) => {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(value))
}

const authorFullName = (application: (typeof applicationsStore.items.value)[number]) => {
  const firstName = application.author?.firstName ?? ''
  const lastName = application.author?.lastName ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || application.author?.username || '—'
}

const appHomePath = (application: (typeof applicationsStore.items.value)[number]) => {
  const appSlug = application.slug ?? application.id
  const platformKey = application.platformKey ?? 'crm'

  return `/platform/${appSlug}/${platformKey}/home`
}

const authorUsername = (application: (typeof applicationsStore.items.value)[number]) => {
  return application.author?.username ?? ''
}

const authorProfilePath = (application: (typeof applicationsStore.items.value)[number]) => {
  if (application.isOwner) {
    return '/profile'
  }

  const currentUserId = authSession.profile?.id
  const authorId = application.author?.id

  if (currentUserId && authorId && currentUserId === authorId) {
    return '/profile'
  }

  const username = authorUsername(application)
  if (username) {
    return `/user/${username}/profile`
  }

  return undefined
}

const openEditModal = (application: (typeof applicationsStore.items.value)[number]) => {
  selectedApp.value = {
    ...application,
  }
  editDialog.value = true
}

const openDeleteModal = (application: (typeof applicationsStore.items.value)[number]) => {
  selectedApp.value = application
  deleteDialog.value = true
}

const saveApplication = async () => {
  if (!selectedApp.value) {
    return
  }

  submitting.value = true

  try {
    await applicationsStore.update(selectedApp.value.id, {
      title: selectedApp.value.title.trim(),
      status: selectedApp.value.status,
      private: selectedApp.value.private,
    })
    editDialog.value = false
  }
  finally {
    submitting.value = false
  }
}

const disableApplication = async () => {
  if (!selectedApp.value) {
    return
  }

  submitting.value = true

  try {
    await applicationsStore.disable(selectedApp.value.id)
    deleteDialog.value = false
    selectedApp.value = null
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UiPageSection max-width="1200">
    <section class="platform-page">
      <div class="platform-page__layout">
        <aside class="platform-page__sidebar" aria-hidden="true" />

        <div class="platform-page__content">
          <div class="platform-page__grid">
            <article class="platform-page__card platform-page__card--new" role="button" tabindex="0" @click="goToNewPlatform">
              <div class="platform-page__add-icon"><v-icon icon="mdi-earth"/></div>
              <h2 class="platform-page__new-title">
                {{ isAuthenticated ? t('platform.newPlatform.title') : t('platform.newPlatform.connectTitle') }}
              </h2>
              <p class="platform-page__new-description">
                {{ isAuthenticated ? t('platform.newPlatform.description') : t('platform.newPlatform.connectDescription') }}
              </p>
            </article>

            <article
              v-for="card in applicationsStore.items"
              :key="card.id"
              class="platform-page__card"
            >
              <v-menu v-if="card.isOwner" location="bottom end">
                <template #activator="{ props }">
                  <v-btn
                    class="platform-page__card-dot"
                    icon="mdi-dots-vertical"
                    variant="text"
                    density="compact"
                    v-bind="props"
                  />
                </template>

                <v-list density="compact">
                  <v-list-item :title="t('platform.actions.edit')" @click="openEditModal(card)" />
                  <v-list-item :title="t('platform.actions.delete')" @click="openDeleteModal(card)" />
                </v-list>
              </v-menu>

              <NuxtLink :to="appHomePath(card)" class="platform-page__card-main-link">
                <div class="platform-page__card-top">
                  <div class="platform-page__card-brand">
                    <img :src="card.photo" :alt="card.title" class="platform-page__logo">
                    <div class="platform-page__card-heading">
                      <div class="platform-page__card-title-row">
                        <h3 class="platform-page__card-title">{{ card.title }}</h3>
                        <v-tooltip v-if="card.description" location="top">
                          <template #activator="{ props }">
                            <v-btn
                              icon="mdi-information-outline"
                              size="x-small"
                              variant="text"
                              density="comfortable"
                              class="platform-page__description-tooltip-trigger"
                              v-bind="props"
                            />
                          </template>
                          <span>{{ card.description }}</span>
                        </v-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </NuxtLink>

              <div class="platform-page__card-meta">
                <UserIdentity
                  :first-name="card.author?.firstName"
                  :last-name="card.author?.lastName"
                  :username="authorUsername(card)"
                  :photo="card.author?.photo"
                  :profile-path="authorProfilePath(card)"
                />
                <v-chip
                  :color="card.status === 'active' ? 'success' : undefined"
                  variant="tonal"
                  size="small"
                  class="text-capitalize"
                >
                  {{ card.status === 'active' ? t('platform.status.active') : t('platform.status.inactive') }}
                </v-chip>
              </div>

              <div class="platform-page__card-footer">
                <span>{{ card.platformName }}</span>
                <span>{{ formatDate(card.createdAt) }}</span>
              </div>
            </article>
          </div>
        </div>
      </div>

      <UiActionDialog v-model="editDialog" :title="t('platform.actions.editTitle')" max-width="560" persistent>
        <template v-if="selectedApp">
          <v-text-field v-model="selectedApp.title" :label="t('platform.wizard.fields.title')" class="mb-3" />
          <v-select
            v-model="selectedApp.status"
            :label="t('platform.wizard.fields.active')"
            :items="[
              { title: t('platform.status.active'), value: 'active' },
              { title: t('platform.status.inactive'), value: 'inactive' },
            ]"
            item-title="title"
            item-value="value"
            class="mb-3"
          />
          <v-switch v-model="selectedApp.private" :label="t('platform.wizard.fields.private')" inset hide-details />
        </template>

        <template #actions>
          <v-btn variant="text" :disabled="submitting" @click="editDialog = false">{{ t('admin.common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="submitting" @click="saveApplication">{{ t('admin.common.save') }}</v-btn>
        </template>
      </UiActionDialog>

      <UiActionConfirmDialog
        v-model="deleteDialog"
        :title="t('platform.actions.deleteTitle')"
        :message="t('platform.actions.deleteMessage', { title: selectedApp?.title || '' })"
        :confirm-label="t('platform.actions.delete')"
        :cancel-label="t('admin.common.cancel')"
        :loading="submitting"
        @confirm="disableApplication"
      />

      <button type="button" class="platform-page__assistant" :aria-label="t('platform.assistant')">
        <v-icon icon="mdi-message-outline" size="22" />
        <v-icon icon="mdi-format-list-bulleted" size="22" />
      </button>
    </section>
  </UiPageSection>
</template>

<style scoped>
.platform-page {
  padding: 1.5rem;
}

.platform-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 1rem;
}

.platform-page__sidebar {
  min-height: 100%;
}

.platform-page__content {
  min-width: 0;
}

.platform-page__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.platform-page__card {
  position: relative;
  background: linear-gradient(160deg, #f6f6f8 0%, #ececef 100%);
  border-radius: 14px;
  border: 1px solid #d4d5dc;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  padding: 1rem;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.platform-page__card::before {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 26px 26px 0;
  border-color: transparent #d9d5ff transparent transparent;
  transition: border-width 0.25s ease;
}

.platform-page__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(45, 45, 94, 0.16);
}

.platform-page__card:hover::before {
  border-width: 0 36px 36px 0;
}

.platform-page__card-dot {
  position: absolute;
  right: 0.4rem;
  top: 0.4rem;
}

.platform-page__card--new {
  border: 2px dashed #2f3033;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
}

.platform-page__add-icon {
  width: 64px;
  height: 64px;
  color: #e82f7d;
  display: grid;
  place-items: center;
  font-size: 2.8rem;
  margin-bottom: 1rem;
}

.platform-page__new-title,
.platform-page__card-title {
  line-height: 1.2;
  font-weight: 700;
  color: #25262c;
}

.platform-page__new-title {
  margin-bottom: 0.8rem;
}

.platform-page__new-description,
.platform-page__card-description {
  color: #55565c;
  line-height: 1.4;
}

.platform-page__card-main-link {
  color: inherit;
  text-decoration: none;
  display: block;
  flex: 1;
}

.platform-page__card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.platform-page__card-brand {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.platform-page__logo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  background: #5955e0;
}

.platform-page__card-heading {
  min-width: 0;
}

.platform-page__card-title {
  font-size: 1.28rem;
}

.platform-page__card-title-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.platform-page__description-tooltip-trigger {
  color: #707287;
}

.platform-page__card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.8rem;
  gap: 0.5rem;
}

.platform-page__card-footer {
  margin-top: 0.7rem;
  padding-top: 0.7rem;
  border-top: 1px solid #d9dadf;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #575c6f;
  font-weight: 600;
  font-size: 0.9rem;
}

.platform-page__assistant {
  position: fixed;
  right: 12px;
  top: 58%;
  transform: translateY(-50%);
  width: 48px;
  height: 90px;
  border-radius: 24px;
  border: 2px solid #0f1014;
  background: #1e2025;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

@media (max-width: 1200px) {
  .platform-page__layout {
    grid-template-columns: 1fr;
  }

  .platform-page__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .platform-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .platform-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
