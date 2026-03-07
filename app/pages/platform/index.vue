<script setup lang="ts">
import UserIdentity from "~/components/UserIdentity.vue";
import UiPageSection from "~/components/ui/UiPageSection.vue";
import UiEmptyState from "~/components/ui/state/UiEmptyState.vue";
import UiSkeletonCardGrid from "~/components/ui/state/UiSkeletonCardGrid.vue";

definePageMeta({
  public: true,
  requiresAuth: false,
  skeleton: "card-grid",
});

const { t } = useI18n({ useScope: "global" });
const router = useRouter();
const { isAuthenticated } = useAuth();
const applicationsStore = useApplicationsStore();
const authSession = useAuthSessionStore();

const editDialog = ref(false);
const deleteDialog = ref(false);
const submitting = ref(false);
const search = ref("");
const selectedPlatformKey = ref("");
const selectedApp = ref<(typeof applicationsStore.items.value)[number] | null>(
  null,
);
const platformKeyOptions = ["crm", "recruit", "school", "shop"] as const;

const { pending: applicationsPending } = useAsyncData(
  "platform-applications",
  () => applicationsStore.fetch({ limit: 5 }),
);

const loading = computed(
  () => applicationsPending.value || applicationsStore.isLoading,
);
const isEmpty = computed(
  () => !loading.value && applicationsStore.items.length === 0,
);

const goToNewPlatform = () => {
  if (isAuthenticated.value) {
    router.push("/platform/new");
    return;
  }

  router.push("/login");
};

const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
};

const appHomePath = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  const appSlug = application.slug ?? application.id;
  const platformKey = application.platformKey ?? "crm";

  return `/platform/${appSlug}/${platformKey}/home`;
};

const authorUsername = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  return application.author?.username ?? "";
};

const authorProfilePath = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  if (application.isOwner) {
    return "/profile";
  }

  const currentUserId = authSession.profile?.id;
  const authorId = application.author?.id;

  if (currentUserId && authorId && currentUserId === authorId) {
    return "/profile";
  }

  const username = authorUsername(application);
  if (username) {
    return `/user/${username}/profile`;
  }

  return undefined;
};

const applyFilters = async () => {
  applicationsStore.setPage(1);
  await applicationsStore.fetch({
    page: 1,
    limit: 5,
    filters: {
      search: search.value,
      platformKey: selectedPlatformKey.value,
    },
  });
};

const clearFilters = async () => {
  search.value = "";
  selectedPlatformKey.value = "";
  await applyFilters();
};

const togglePlatformKey = async (platformKey: string) => {
  selectedPlatformKey.value =
    selectedPlatformKey.value === platformKey ? "" : platformKey;
  await applyFilters();
};

const onPageChange = async (page: number) => {
  applicationsStore.setPage(page);
  await applicationsStore.fetch({
    page,
    limit: 5,
    filters: {
      search: search.value,
      platformKey: selectedPlatformKey.value,
    },
  });
};

const openEditModal = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  selectedApp.value = {
    ...application,
  };
  editDialog.value = true;
};

const openDeleteModal = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  selectedApp.value = application;
  deleteDialog.value = true;
};

const saveApplication = async () => {
  if (!selectedApp.value) {
    return;
  }

  submitting.value = true;

  try {
    await applicationsStore.update(selectedApp.value.id, {
      title: selectedApp.value.title.trim(),
      status: selectedApp.value.status,
      private: selectedApp.value.private,
    });
    editDialog.value = false;
  } finally {
    submitting.value = false;
  }
};

const disableApplication = async () => {
  if (!selectedApp.value) {
    return;
  }

  submitting.value = true;

  try {
    await applicationsStore.disable(selectedApp.value.id);
    deleteDialog.value = false;
    selectedApp.value = null;
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <UiPageSection max-width="100%">
    <section class="platform-page">
      <UiSkeletonCardGrid v-if="loading" class="platform-page__state" />

      <UiEmptyState
        v-else-if="isEmpty"
        :title="t('platform.title')"
        :description="t('platform.filters.clear')"
        icon="mdi-earth-off"
        class="platform-page__state"
      >
        <template #action>
          <v-btn color="primary" rounded="pill" @click="goToNewPlatform">
            {{ t("platform.newPlatform.worldTitle") }}
          </v-btn>
        </template>
      </UiEmptyState>

      <div v-else class="platform-page__layout">
        <aside class="platform-page__sidebar">
          <v-card class="platform-page__filters" rounded="xl" variant="outlined">
            <v-card-title class="text-h6 platform-page__filters-title">{{
              t("platform.filters.title")
            }}</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="search"
                :label="t('platform.filters.search')"
                prepend-inner-icon="mdi-magnify"
                variant="solo"
                flat
                density="comfortable"
                hide-details
                class="mb-4"
                @keyup.enter="applyFilters"
              />

              <p class="platform-page__platform-key-label mb-2">
                {{ t("platform.filters.platformKey") }}
              </p>
              <div class="platform-page__platform-key-buttons mb-4">
                <v-btn
                  v-for="platformKey in platformKeyOptions"
                  :key="platformKey"
                  :color="
                    selectedPlatformKey === platformKey ? 'primary' : undefined
                  "
                  :variant="
                    selectedPlatformKey === platformKey ? 'flat' : 'outlined'
                  "
                  size="small"
                  rounded="pill"
                  class="text-lowercase"
                  @click="togglePlatformKey(platformKey)"
                >
                  {{ platformKey }}
                </v-btn>
              </div>

              <div class="platform-page__filters-actions">
                <v-btn color="primary" block @click="applyFilters">{{
                  t("platform.filters.apply")
                }}</v-btn>
                <v-btn
                  variant="text"
                  block
                  class="mt-2"
                  @click="clearFilters"
                  >{{ t("platform.filters.clear") }}</v-btn
                >
              </div>
            </v-card-text>
          </v-card>
        </aside>

        <div class="platform-page__content">
          <div class="platform-page__toolbar">
            <h2 class="platform-page__title">{{ t("platform.title") }}</h2>
            <v-btn color="primary" rounded="pill" @click="goToNewPlatform">
              {{ t("platform.newPlatform.worldTitle") }}
            </v-btn>
          </div>

          <v-card class="platform-page__applications" rounded="xl" variant="outlined">
            <v-card-text>
              <div class="platform-page__cards-grid">
                <v-card
                  v-for="card in applicationsStore.items"
                  :key="card.id"
                  class="platform-page__application-card"
                  rounded="lg"
                  variant="outlined"
                >
                  <div class="platform-page__card-header">
                    <NuxtLink :to="appHomePath(card)" class="platform-page__row-main-link">
                      <div class="platform-page__row-brand">
                        <img :src="card.photo" :alt="card.title" class="platform-page__logo" />
                        <div>
                          <p class="platform-page__row-title">{{ card.title }}</p>
                          <p class="platform-page__row-description">
                            {{ card.description || card.platformName }}
                          </p>
                        </div>
                      </div>
                    </NuxtLink>

                    <v-menu v-if="card.isOwner" location="bottom end">
                      <template #activator="{ props }">
                        <v-btn icon="mdi-dots-vertical" variant="text" density="comfortable" v-bind="props" />
                      </template>
                      <v-list density="compact">
                        <v-list-item :title="t('platform.actions.edit')" @click="openEditModal(card)" />
                        <v-list-item :title="t('platform.actions.delete')" @click="openDeleteModal(card)" />
                      </v-list>
                    </v-menu>
                  </div>

                  <div class="platform-page__chips-row">
                    <v-chip size="small" variant="tonal" class="text-uppercase">
                      {{ card.platformKey }}
                    </v-chip>
                    <v-chip
                      :color="card.status === 'active' ? 'success' : undefined"
                      variant="tonal"
                      size="small"
                      class="text-capitalize"
                    >
                      {{
                        card.status === "active"
                          ? t("platform.status.active")
                          : t("platform.status.inactive")
                      }}
                    </v-chip>
                  </div>

                  <div class="platform-page__card-meta">
                    <div>
                      <p class="platform-page__meta-label">{{ t("platform.table.owner") }}</p>
                      <UserIdentity
                        :first-name="card.author?.firstName"
                        :last-name="card.author?.lastName"
                        :username="authorUsername(card)"
                        :photo="card.author?.photo"
                        :profile-path="authorProfilePath(card)"
                      />
                    </div>
                    <div>
                      <p class="platform-page__meta-label">{{ t("platform.table.updatedAt") }}</p>
                      <p class="platform-page__meta-value">{{ formatDate(card.createdAt) }}</p>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-card-text>
          </v-card>

          <div class="platform-page__pagination">
            <v-pagination
              :model-value="applicationsStore.pagination.page"
              :length="applicationsStore.pagination.totalPages"
              :total-visible="6"
              @update:model-value="onPageChange"
            />
          </div>
        </div>
      </div>

      <UiActionDialog
        v-model="editDialog"
        :title="t('platform.actions.editTitle')"
        max-width="560"
        persistent
      >
        <template v-if="selectedApp">
          <v-text-field
            v-model="selectedApp.title"
            :label="t('platform.wizard.fields.title')"
            class="mb-3"
          />
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
          <v-switch
            v-model="selectedApp.private"
            :label="t('platform.wizard.fields.private')"
            inset
            hide-details
          />
        </template>

        <template #actions>
          <v-btn
            variant="text"
            :disabled="submitting"
            @click="editDialog = false"
            >{{ t("admin.common.cancel") }}</v-btn
          >
          <v-btn
            color="primary"
            :loading="submitting"
            @click="saveApplication"
            >{{ t("admin.common.save") }}</v-btn
          >
        </template>
      </UiActionDialog>

      <UiActionConfirmDialog
        v-model="deleteDialog"
        :title="t('platform.actions.deleteTitle')"
        :message="
          t('platform.actions.deleteMessage', {
            title: selectedApp?.title || '',
          })
        "
        :confirm-label="t('platform.actions.delete')"
        :cancel-label="t('admin.common.cancel')"
        :loading="submitting"
        @confirm="disableApplication"
      />

      <button
        type="button"
        class="platform-page__assistant"
        :aria-label="t('platform.assistant')"
      >
        <v-icon icon="mdi-message-outline" size="22" />
        <v-icon icon="mdi-format-list-bulleted" size="22" />
      </button>
    </section>
  </UiPageSection>
</template>

<style scoped>
.platform-page {
  padding: var(--platform-space-6);
  color: var(--platform-color-text-primary);
}

.platform-page__state {
  border: 1px dashed var(--platform-color-border);
  border-radius: var(--platform-radius-md);
}

.platform-page__layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: var(--platform-space-5);
  align-items: start;
}

.platform-page__sidebar {
  position: sticky;
  top: calc(var(--platform-space-5) + 8px);
}

.platform-page__filters {
  position: relative;
  border-radius: var(--platform-radius-md);
  border: 1px solid var(--platform-color-border);
  box-shadow: var(--platform-shadow-sm);
  background: linear-gradient(
    180deg,
    var(--platform-color-surface) 0%,
    var(--platform-color-surface-muted) 100%
  );
}

.platform-page__filters-title {
  font-weight: 700;
  color: var(--platform-color-text-primary);
}

.platform-page__platform-key-label {
  font-size: 0.86rem;
  color: var(--platform-color-text-secondary);
  font-weight: 600;
}

.platform-page__platform-key-buttons,
.platform-page__filters-actions,
.platform-page__card-title-row {
  display: flex;
}

.platform-page__platform-key-buttons {
  flex-wrap: wrap;
  gap: var(--platform-space-2);
}

.platform-page__filters-actions {
  flex-direction: column;
}

.platform-page__content {
  min-width: 0;
}

.platform-page__toolbar,
.platform-page__row-brand,
.platform-page__pagination {
  display: flex;
  align-items: center;
}

.platform-page__card-header {
  display: flex;
  justify-content: space-between;
  gap: var(--platform-space-2);
}

.platform-page__chips-row {
  display: flex;
  gap: var(--platform-space-2);
  flex-wrap: wrap;
}

.platform-page__card-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--platform-space-3);
}

.platform-page__meta-label {
  margin: 0 0 0.2rem;
  font-size: 0.72rem;
  color: var(--platform-color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.platform-page__meta-value {
  margin: 0;
  color: var(--platform-color-text-secondary);
  font-weight: 600;
}
.platform-page__toolbar {
  justify-content: space-between;
  margin-bottom: var(--platform-space-3);
  gap: var(--platform-space-3);
}

.platform-page__title {
  font-size: 1.1rem;
  font-weight: 700;
}

.platform-page__applications {
  border: 1px solid var(--platform-color-border);
  background: linear-gradient(
    180deg,
    var(--platform-color-surface) 0%,
    var(--platform-color-surface-muted) 100%
  );
  box-shadow: var(--platform-shadow-sm);
}

.platform-page__cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--platform-space-3);
}

.platform-page__application-card {
  border: 1px solid var(--platform-color-border);
  background: var(--platform-color-surface);
  padding: var(--platform-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--platform-space-3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.platform-page__application-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--platform-shadow-sm);
}

.platform-page__logo {
  width: 42px;
  height: 42px;
  border-radius: var(--platform-radius-sm);
  object-fit: cover;
  background: var(--platform-color-accent-soft);
}

.platform-page__row-main-link {
  text-decoration: none;
  color: inherit;
}

.platform-page__row-brand {
  gap: var(--platform-space-2);
}

.platform-page__row-title {
  margin: 0;
  font-weight: 700;
}

.platform-page__row-description {
  margin: 0;
  color: var(--platform-color-text-tertiary);
  font-size: 0.82rem;
}

.platform-page__pagination {
  margin-top: var(--platform-space-4);
  justify-content: center;
}

.platform-page__assistant {
  position: fixed;
  right: 12px;
  top: 58%;
  transform: translateY(-50%);
  width: 48px;
  height: 90px;
  border-radius: var(--platform-radius-pill);
  border: 2px solid var(--platform-color-border-strong);
  background: var(--platform-color-surface);
  color: var(--platform-color-text-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  box-shadow: var(--platform-shadow-md);
}

@media (max-width: 1200px) {
  .platform-page__layout {
    grid-template-columns: 1fr;
  }

  .platform-page__sidebar {
    position: static;
  }

  .platform-page__cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .platform-page {
    padding: var(--platform-space-4);
  }

  .platform-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .platform-page__cards-grid {
    grid-template-columns: 1fr;
  }

  .platform-page__card-meta {
    flex-direction: column;
  }
}
</style>
