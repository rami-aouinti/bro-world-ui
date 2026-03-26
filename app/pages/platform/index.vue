<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import UserIdentity from "~/components/UserIdentity.vue";
import UiEmptyState from "~/components/ui/state/UiEmptyState.vue";
import UiSkeletonCardGrid from "~/components/ui/state/UiSkeletonCardGrid.vue";
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";
import PlatformSidebarNav from "~/components/platform/PlatformSidebarNav.vue";
import UiCard from '~/components/ui/UiCard.vue'

const UiActionDialog = defineAsyncComponent(() => import("~/components/ui/UiActionDialog.vue"));
const UiActionConfirmDialog = defineAsyncComponent(() => import("~/components/ui/UiActionConfirmDialog.vue"));

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
const loading = ref(true);
const selectedPlatformKey = ref("");
const selectedApp = ref<(typeof applicationsStore.items.value)[number] | null>(
  null,
);
const platformKeyOptions = ["crm", "recruit", "school", "shop"] as const;
const allowedPlatformKeys = new Set(platformKeyOptions);
const fallbackPlatformKey = "crm";

const resolvePlatformKey = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  const normalizedPlatformKey = application.platformKey?.trim().toLowerCase();
  if (normalizedPlatformKey && allowedPlatformKeys.has(normalizedPlatformKey as (typeof platformKeyOptions)[number])) {
    return normalizedPlatformKey;
  }

  const normalizedPlatformName = application.platformName?.trim().toLowerCase() ?? "";
  if (normalizedPlatformName) {
    const matchedPlatformName = platformKeyOptions.find((platformKey) => {
      return (
        normalizedPlatformName === platformKey ||
        normalizedPlatformName.includes(platformKey)
      );
    });

    if (matchedPlatformName) {
      return matchedPlatformName;
    }
  }

  console.warn("[platform/index] Unknown platform key, using fallback.", {
    applicationId: application.id,
    slug: application.slug,
    platformKey: application.platformKey,
    platformName: application.platformName,
    fallback: fallbackPlatformKey,
  });

  return fallbackPlatformKey;
};

const fakeInsightsByPlatform: Record<
  string,
  {
    health: string;
    growth: string;
    users: string;
    activity: string;
    spotlight: string;
    tags: string[];
  }
> = {
  crm: {
    health: "98%",
    growth: "+18%",
    users: "124 clients",
    activity: "42 deals en cours",
    spotlight: "B2B pipeline boosted by follow-up automation.",
    tags: ["Sales", "Pipeline", "Automation"],
  },
  recruit: {
    health: "95%",
    growth: "+26%",
    users: "89 candidats actifs",
    activity: "17 planned interviews",
    spotlight: "AI matching optimized for senior technical profiles.",
    tags: ["Hiring", "Talent", "Interviews"],
  },
  school: {
    health: "97%",
    growth: "+11%",
    users: "312 apprenants",
    activity: "28 classes live cette semaine",
    spotlight: "New hybrid pathways with continuous pedagogical tracking.",
    tags: ["Learning", "Classes", "Mentoring"],
  },
  shop: {
    health: "96%",
    growth: "+22%",
    users: "1 240 clients",
    activity: "68 commandes aujourd'hui",
    spotlight: "Average cart value up thanks to seasonal bundles.",
    tags: ["E-commerce", "Orders", "Conversion"],
  },
};

const summaryHighlights = computed(() => {
  const totalApps = applicationsStore.pagination.totalItems || applicationsStore.items.length;
  const activeApps = applicationsStore.items.filter((item) => item.status === "active").length;
  const privateApps = applicationsStore.items.filter((item) => item.private).length;

  return [
    { label: "Applications visibles", value: String(totalApps), icon: "mdi-view-grid-outline" },
    { label: "Applications actives", value: String(activeApps), icon: "mdi-rocket-launch-outline" },
    { label: "Private applications", value: String(privateApps), icon: "mdi-lock-outline" },
  ];
});

const { pending: applicationsPending, execute: loadApplications } = useAsyncData(
  "platform-applications",
  () => applicationsStore.fetch({ limit: 4 }),
  {
    server: false,
    immediate: false,
  },
);

onMounted(async () => {
  await loadApplications()
  await nextTick()
  loading.value = false
})
const isEmpty = computed(
  () => applicationsStore.items.length === 0,
);

const goToNewPlatform = () => {
  if (isAuthenticated.value) {
    router.push("/platform/new");
    return;
  }

  router.push("/login");
};

const appHomePath = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  const appSlug = application.slug ?? application.id;
  const platformKey = resolvePlatformKey(application);

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
  loading.value = true;
  applicationsStore.setPage(1);
  await applicationsStore.fetch({
    page: 1,
    limit: 4,
    filters: {
      search: search.value,
      platformKey: selectedPlatformKey.value,
    },
  });
  loading.value = false;
};

const clearFilters = async () => {
  loading.value = true;
  search.value = "";
  selectedPlatformKey.value = "";
  await applyFilters();
  loading.value = false;
};

const togglePlatformKey = async (platformKey: string) => {
  loading.value = true;
  selectedPlatformKey.value =
    selectedPlatformKey.value === platformKey ? "" : platformKey;
  await applyFilters();
  loading.value = false;
};

const onPageChange = async (page: number) => {
  loading.value = true;
  applicationsStore.setPage(page);
  await applicationsStore.fetch({
    page,
    limit: 5,
    filters: {
      search: search.value,
      platformKey: selectedPlatformKey.value,
    },
  });
  loading.value = false;
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

const getCardInsights = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  const key = resolvePlatformKey(application);

  return fakeInsightsByPlatform[key || ""] ?? {
    health: "94%",
    growth: "+12%",
    users: "60 utilisateurs",
    activity: "24 recent actions",
    spotlight: "Stable performance with scaling opportunities.",
    tags: ["Operations", "Insights", "Monitoring"],
  };
};

const shouldRenderEditDialog = computed(() => editDialog.value || submitting.value);
const shouldRenderDeleteDialog = computed(() => deleteDialog.value || submitting.value);
</script>

<template>
  <PlatformSplitLayout>

    <template #sidebar>
      <div class="ga-3 d-flex flex-column">
        <h3> Platform </h3>
        <UiCard
            @click="goToNewPlatform"
            class="home-hero platform-page__application-card"
            height="200"
            variant="outlined"
            rounded="xl"
            elevation="8"
        >
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <v-icon icon="mdi-earth" size="64" class="mx-auto" color="primary" />
              <h3> {{ t("platform.newPlatform.worldTitle") }} </h3>
            </div>
          </v-card-text>
        </UiCard>

        <div class="d-flex flex-column align-center mt-4">
          <article
              v-for="highlight in summaryHighlights"
              :key="highlight.label"
              class="platform-page__highlight"
          >
            <v-icon :icon="highlight.icon" size="20" color="primary" />
            <p class="platform-page__highlight-label px-2">{{ highlight.label }}</p>
            <p class="platform-page__highlight-value px-2">{{ highlight.value }}</p>
          </article>
        </div>
      </div>
    </template>

    <template #aside>
      <h3 class="platform-page__aside-title"> Filter </h3>
      <v-text-field
          v-model="search"
          :label="t('platform.filters.search')"
          class="platform-page__search-field"
          variant="outlined"
          density="compact"
          rounded="xl"
          hide-details
          @keyup.enter="applyFilters"
      />
      <div class="platform-page__platform-key-buttons mt-3 mb-4">
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
            rounded="xl"
            variant="text"
            class="text-lowercase mx-auto"
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
    </template>

    <section>
      <UiSkeletonCardGrid :cards="4" :columns="6"  v-if="loading" />
      <div v-else>
        <UiEmptyState
            v-if="isEmpty"
            :title="t('platform.title')"
            :description="t('platform.filters.clear')"
            icon="mdi-earth-off"
            class="platform-page__state"
        >
          <template #action>
            <UiCard
                @click="goToNewPlatform"
                class="home-hero platform-page__application-card"
                rounded="xl"
                elevation="8"
            >
              <v-card-text>
                <div class="d-flex flex-column align-center">
                  <v-icon icon="mdi-earth" size="64" class="mx-auto" color="primary" />
                  <h2> {{ t("platform.newPlatform.worldTitle") }} </h2>
                </div>
              </v-card-text>
            </UiCard>
          </template>
        </UiEmptyState>
        <div v-else class="platform-page__content">
          <v-row class="mt-2">
            <v-col cols="12" md="6" lg="6" v-for="card in applicationsStore.items" :key="card.id">
              <UiCard
                  class="home-hero platform-page__application-card"
                  rounded="xl"
                  variant="outlined"
                  height="180"
                  elevation="8"
              >
                <v-toolbar color="transparent">
                  <NuxtLink :to="appHomePath(card)" class="platform-page__row-main-link">
                    <v-toolbar-title class="mt-4 mx-auto">
                      <p class="platform-page__row-title text-truncate">{{ card.title }}</p>
                    </v-toolbar-title>
                  </NuxtLink>

                  <template v-slot:append>
                    <v-menu v-if="card.isOwner" location="bottom end">
                      <template #activator="{ props }">
                        <v-btn
                          icon="mdi-dots-vertical"
                          variant="text"
                          density="compact"
                          aria-label="Open application actions"
                          v-bind="props"
                        />
                      </template>
                      <v-list density="compact">
                        <v-list-item :title="t('platform.actions.edit')" @click="openEditModal(card)" />
                        <v-list-item :title="t('platform.actions.delete')" @click="openDeleteModal(card)" />
                      </v-list>
                    </v-menu>
                  </template>
                </v-toolbar>

                <div class="platform-page__card-header">
                  <NuxtLink :to="appHomePath(card)" class="platform-page__row-main-link">
                    <div class="platform-page__row-brand">
                      <div class="platform-page__headline">
                        <p class="platform-page__row-description">
                          {{ card.description || card.platformName }}
                        </p>
                      </div>
                    </div>
                  </NuxtLink>
                </div>

                <v-card-actions>
                  <v-row>
                    <div class="justify-items-end">
                      <v-chip size="small" variant="tonal" class="text-uppercase">
                        {{ card.platformKey }}
                      </v-chip>
                    </div>
                  </v-row>
                </v-card-actions>
              </UiCard>
            </v-col>
          </v-row>
          <div class="platform-pagination">
            <v-pagination
                :model-value="applicationsStore.pagination.page"
                :length="applicationsStore.pagination.totalPages"
                :total-visible="4"
                @update:model-value="onPageChange"
            />
          </div>
        </div>
      </div>
      <UiActionDialog
          v-if="shouldRenderEditDialog"
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
          v-if="shouldRenderDeleteDialog"
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
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.platform-pagination {
  position: fixed; bottom: 0; justify-content: center; width: 100%;
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
  box-shadow: var(--platform-shadow-sm);
}

.platform-page__filters-title {
  font-weight: 700;
}

.platform-page__platform-key-label {
  font-size: 0.86rem;
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

.platform-page__aside-title {
  color: rgba(var(--v-theme-on-surface), 0.92);
}

.platform-page__search-field :deep(.v-field-label) {
  color: rgba(var(--v-theme-on-surface), 0.92) !important;
}

.platform-page__content {
  min-width: 0;
}

.platform-page__hero {
  padding: clamp(1rem, 1.4vw + 0.8rem, 1.8rem);
}

.platform-page__hero-overline {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--platform-color-primary);
}

.platform-page__hero-title {
  margin: 0;
  font-size: clamp(1.4rem, 1.8vw + 1rem, 2rem);
  line-height: 1.2;
}

.platform-page__hero-description {
  max-width: 62ch;
  font-size: 0.98rem;
}

.platform-page__hero-stats {
  display: grid;
  gap: var(--platform-space-2);
}

.platform-page__highlight {
  border-radius: var(--platform-radius-md);
  padding: 0.7rem 0.85rem;
  display: flex;
  align-items: center;
  text-align: center;
  gap: var(--platform-space-2);
}

.platform-page__highlight-label {
  margin: 0;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.platform-page__highlight-value {
  margin: 0.1rem 0 0;
  font-size: 1rem;
  font-weight: 700;
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

.platform-page__insights {
  padding: var(--platform-space-3) 0;
}

.platform-page__insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--platform-space-2) var(--platform-space-3);
}

.platform-page__insight-label {
  margin: 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.platform-page__insight-value {
  margin: 0.2rem 0 0;
  font-size: 0.86rem;
  font-weight: 700;
}

.platform-page__spotlight {
  margin-top: var(--platform-space-2);
  font-size: 0.85rem;
  line-height: 1.35;
}

.platform-page__chips-row {
  display: flex;
  gap: var(--platform-space-2);
  flex-wrap: wrap;
  margin-top: calc(var(--platform-space-1) * -1);
}

.platform-page__card-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--platform-space-5);
  padding-top: var(--platform-space-1);
}

.platform-page__meta-label {
  margin: 0 0 0.2rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.platform-page__meta-value {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
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
  box-shadow: var(--platform-shadow-sm);
}

.platform-page__cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--platform-space-5);
}

.platform-page__application-card {
  padding: var(--platform-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--platform-space-3);
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
  box-shadow: 0 8px 20px rgba(18, 28, 45, 0.08);
}

.platform-page__application-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 28px rgba(18, 28, 45, 0.14);
}

.platform-page__cover {
  width: 100%;
  height: 118px;
  border-radius: calc(var(--platform-radius-md) - 2px);
  object-fit: cover;
  background: var(--platform-color-accent-soft);
  box-shadow: 0 10px 22px rgba(8, 18, 36, 0.2);
}

.platform-page__row-main-link {
  text-decoration: none;
  color: inherit;
}

.platform-page__row-brand {
  display: grid;
  gap: var(--platform-space-2);
}

.platform-page__headline {
  text-align: center;
  padding: 0 var(--platform-space-2);
}

.platform-page__row-title {
  margin: 0;
  font-weight: 700;
  font-size: 0.8rem;
  line-height: 1.2;
}

.platform-page__row-description {
  margin: var(--platform-space-1) 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

  .platform-page__row-title {
    font-size: 1.05rem;
  }
}
</style>
