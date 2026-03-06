<script setup lang="ts">
import UiPageSection from "~/components/ui/UiPageSection.vue";

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
const router = useRouter()
const { isAuthenticated, initSession } = useAuth()
const applicationsStore = useApplicationsStore()

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

  return fullName || '—'
}

const authorAvatar = (application: (typeof applicationsStore.items.value)[number]) => {
  if (application.author?.photo) {
    return application.author.photo
  }

  const name = encodeURIComponent(authorFullName(application))
  return `https://ui-avatars.com/api/?name=${name}`
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
  <UiPageSection>
    <section class="platform-page">
      <div class="platform-page__grid">
        <article class="platform-page__card platform-page__card--new" role="button" tabindex="0" @click="goToNewPlatform">
          <div class="platform-page__add-icon">+</div>
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

          <div class="platform-page__card-top">
            <div class="platform-page__card-brand">
              <img :src="card?.photo" :alt="card.title" class="platform-page__logo">
              <div class="platform-page__card-heading">
                <h3 class="platform-page__card-title">{{ card.title }}</h3>
              </div>
            </div>

          </div>
          <div class="platform-page__card-brand py-4">
            <img :src="authorAvatar(card)" :alt="authorFullName(card)" class="user__logo">
            <p class="platform-page__card-author">{{ authorFullName(card) }}</p>
            <v-chip
                :color="card.status === 'active' ? 'success' : undefined"
                variant="tonal"
                size="small"
                class="text-capitalize"
            >
              {{ card.status === 'active' ? t('platform.status.active') : t('platform.status.inactive') }}
            </v-chip>
          </div>
          <p class="platform-page__card-description">{{ card.description }}</p>

          <div class="platform-page__card-footer">
            <span>{{ card.platformName }}</span>
            <span>{{ formatDate(card.createdAt) }}</span>
          </div>
        </article>
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

.platform-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.75rem 1.5rem;
}

.platform-page__card {
  position: relative;
  background: #ededee;
  border-radius: 12px;
  border: 1px solid #d2d2d5;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  padding: 1.7rem;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.platform-page__card-dot {
  position: absolute;
  right: 0.7rem;
  top: 0.7rem;
}

.platform-page__card--new {
  border: 3px dashed #2f3033;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
}

.platform-page__add-icon {
  width: 70px;
  height: 70px;
  border-radius: 999px;
  border: 6px solid #e82f7d;
  color: #e82f7d;
  display: grid;
  place-items: center;
  font-size: 3.2rem;
  line-height: 1;
  margin-bottom: 1.3rem;
}

.platform-page__new-title,
.platform-page__card-title {
  line-height: 1.2;
  font-weight: 700;
  color: #25262c;
}

.platform-page__new-title {
  margin-bottom: 1rem;
}

.platform-page__new-description,
.platform-page__card-description {
  color: #55565c;
  font-size: 1.08rem;
  line-height: 1.45;
}

.platform-page__card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.platform-page__card-brand {
  display: flex;
  gap: 1rem;
}

.platform-page__logo {
  width: 76px;
  height: 76px;
  border-radius: 16px;
  object-fit: cover;
  background: #5955e0;
}

.user__logo {
  width: 24px;
  height: 24px;
  border-radius: 16px;
  object-fit: cover;
  background: #5955e0;
}

.platform-page__card-heading {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.platform-page__card-author {
  margin: 0;
  color: #2e2f37;
  font-size: 1rem;
  font-weight: 600;
}

.platform-page__card-description {
  margin-top: 1.2rem;
  flex: 1;
}

.platform-page__card-footer {
  margin-top: 1.2rem;
  padding-top: 0.9rem;
  border-top: 1px solid #d9dadf;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #575c6f;
  font-weight: 600;
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
</style>
