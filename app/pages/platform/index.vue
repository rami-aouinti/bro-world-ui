<script setup lang="ts">
import UserIdentity from "~/components/UserIdentity.vue";
import UiPageSection from "~/components/ui/UiPageSection.vue";
import UiEmptyState from "~/components/ui/state/UiEmptyState.vue";
import UiSkeletonCardGrid from "~/components/ui/state/UiSkeletonCardGrid.vue";
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";
import PlatformSidebarNav from "~/components/platform/PlatformSidebarNav.vue";

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
    spotlight: "Pipeline B2B boosté par l'automatisation des relances.",
    tags: ["Sales", "Pipeline", "Automation"],
  },
  recruit: {
    health: "95%",
    growth: "+26%",
    users: "89 candidats actifs",
    activity: "17 entretiens planifiés",
    spotlight: "Matching IA optimisé sur les profils techniques senior.",
    tags: ["Hiring", "Talent", "Interviews"],
  },
  school: {
    health: "97%",
    growth: "+11%",
    users: "312 apprenants",
    activity: "28 classes live cette semaine",
    spotlight: "Nouveaux parcours hybrides avec suivi pédagogique continu.",
    tags: ["Learning", "Classes", "Mentoring"],
  },
  shop: {
    health: "96%",
    growth: "+22%",
    users: "1 240 clients",
    activity: "68 commandes aujourd'hui",
    spotlight: "Panier moyen en hausse grâce aux bundles saisonniers.",
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
    { label: "Applications privées", value: String(privateApps), icon: "mdi-lock-outline" },
  ];
});

const { pending: applicationsPending, execute: loadApplications } = useAsyncData(
  "platform-applications",
  () => applicationsStore.fetch({ limit: 5 }),
  {
    server: false,
    immediate: false,
  },
);

onMounted(() => {
  void loadApplications();
});

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

const getCardInsights = (
  application: (typeof applicationsStore.items.value)[number],
) => {
  const key = resolvePlatformKey(application);

  return fakeInsightsByPlatform[key || ""] ?? {
    health: "94%",
    growth: "+12%",
    users: "60 utilisateurs",
    activity: "24 actions récentes",
    spotlight: "Performance stable avec des opportunités de montée en charge.",
    tags: ["Operations", "Insights", "Monitoring"],
  };
};
</script>

<template>
  <PlatformSplitLayout>

    <template #sidebar>
      <PlatformSidebarNav title="Platform" subtitle="platform.common.sidebar.application" :items="[]">
        <v-text-field
            v-model="search"
            :label="t('platform.filters.search')"
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            flat
            density="compact"
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
      </PlatformSidebarNav>
    </template>

    <section>
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
      <div v-else class="platform-page__content">
        <v-card class="platform-page__hero" rounded="xl" elevation="0">
          <v-row>
            <v-col cols="12" lg="7">
              <p class="platform-page__hero-overline mb-2">Bro World Platform</p>
              <h1 class="platform-page__hero-title mb-3">Pilotage unifié de vos applications</h1>
              <p class="platform-page__hero-description mb-0">
                Une vue claire pour suivre la santé de vos plateformes, identifier les leviers de croissance
                et basculer rapidement vers les opérations critiques.
              </p>
            </v-col>
            <v-col cols="12" lg="5">
              <div class="platform-page__hero-stats">
                <article
                  v-for="highlight in summaryHighlights"
                  :key="highlight.label"
                  class="platform-page__highlight"
                >
                  <v-icon :icon="highlight.icon" size="20" color="primary" />
                  <div>
                    <p class="platform-page__highlight-label">{{ highlight.label }}</p>
                    <p class="platform-page__highlight-value">{{ highlight.value }}</p>
                  </div>
                </article>
              </div>
            </v-col>
          </v-row>
        </v-card>

        <v-row class="mt-12">
          <v-col cols="12" md="6" lg="4">
            <v-card
                @click="goToNewPlatform"
                class="platform-page__application-card"
                rounded="xl"
                elevation="8"
            >
              <v-card-text>
                <div class="d-flex flex-column align-center">
                  <v-icon icon="mdi-earth" size="64" class="mx-auto" color="primary" />
                  <h2> {{ t("platform.newPlatform.worldTitle") }} </h2>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6" lg="4" v-for="card in applicationsStore.items" :key="card.id">
            <v-card
                class="platform-page__application-card"
                rounded="xl"
                elevation="8"
            >
              <v-toolbar color="transparent">
                <template v-slot:prepend>
                  <v-img rounded="xl" :src="card.photo" cover color="primary" :alt="card.title" height="40" width="40" />
                </template>
                <NuxtLink :to="appHomePath(card)" class="platform-page__row-main-link">
                  <v-toolbar-title class="mt-4 mx-auto">
                    <p class="platform-page__row-title">{{ card.title }}</p>
                  </v-toolbar-title>
                </NuxtLink>

                <template v-slot:append>
                  <v-menu v-if="card.isOwner" location="bottom end">
                    <template #activator="{ props }">
                      <v-btn icon="mdi-dots-vertical" variant="text" density="compact" v-bind="props" />
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

              <div class="platform-page__insights">
                <div class="platform-page__insight-grid">
                  <div>
                    <p class="platform-page__insight-label">Santé</p>
                    <p class="platform-page__insight-value">{{ getCardInsights(card).health }}</p>
                  </div>
                  <div>
                    <p class="platform-page__insight-label">Croissance</p>
                    <p class="platform-page__insight-value">{{ getCardInsights(card).growth }}</p>
                  </div>
                  <div>
                    <p class="platform-page__insight-label">Audience</p>
                    <p class="platform-page__insight-value">{{ getCardInsights(card).users }}</p>
                  </div>
                  <div>
                    <p class="platform-page__insight-label">Activité</p>
                    <p class="platform-page__insight-value">{{ getCardInsights(card).activity }}</p>
                  </div>
                </div>
                <p class="platform-page__spotlight mb-0">{{ getCardInsights(card).spotlight }}</p>
                <div class="platform-page__chips-row mt-2">
                  <v-chip
                    v-for="tag in getCardInsights(card).tags"
                    :key="tag"
                    size="x-small"
                    variant="tonal"
                    color="primary"
                  >
                    {{ tag }}
                  </v-chip>
                </div>
              </div>

              <v-card-actions>
                <v-row>
                  <div class="justify-self-start">
                    <UserIdentity
                        :first-name="card.author?.firstName"
                        :last-name="card.author?.lastName"
                        :username="authorUsername(card)"
                        :photo="card.author?.photo"
                        :profile-path="authorProfilePath(card)"
                    />
                  </div>
                  <v-spacer></v-spacer>
                  <div class="justify-items-end">
                    <v-chip size="small" variant="tonal" class="text-uppercase">
                      {{ card.platformKey }}
                    </v-chip>
                  </div>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        <div class="platform-pagination">
          <v-pagination
              :model-value="applicationsStore.pagination.page"
              :length="applicationsStore.pagination.totalPages"
              :total-visible="6"
              @update:model-value="onPageChange"
          />
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
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.platform-pagination {
  position: fixed; bottom: 0; justify-content: center; width: 100%;
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

.platform-page__hero {
  border: 1px solid color-mix(in srgb, var(--platform-color-primary) 18%, var(--platform-color-border));
  background: radial-gradient(circle at top right, rgba(39, 117, 255, 0.17), transparent 48%),
    linear-gradient(180deg, color-mix(in srgb, var(--platform-color-surface) 90%, #fff 10%) 0%, var(--platform-color-surface) 100%);
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
  color: var(--platform-color-text-primary);
}

.platform-page__hero-description {
  max-width: 62ch;
  color: var(--platform-color-text-secondary);
  font-size: 0.98rem;
}

.platform-page__hero-stats {
  display: grid;
  gap: var(--platform-space-2);
}

.platform-page__highlight {
  border: 1px solid color-mix(in srgb, var(--platform-color-border) 70%, transparent);
  border-radius: var(--platform-radius-md);
  background: color-mix(in srgb, var(--platform-color-surface) 86%, #fff 14%);
  padding: 0.7rem 0.85rem;
  display: flex;
  align-items: center;
  gap: var(--platform-space-2);
}

.platform-page__highlight-label {
  margin: 0;
  color: var(--platform-color-text-tertiary);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.platform-page__highlight-value {
  margin: 0.1rem 0 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--platform-color-text-primary);
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
  border-top: 1px solid color-mix(in srgb, var(--platform-color-border) 60%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--platform-color-border) 50%, transparent);
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
  color: var(--platform-color-text-tertiary);
}

.platform-page__insight-value {
  margin: 0.2rem 0 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--platform-color-text-primary);
}

.platform-page__spotlight {
  margin-top: var(--platform-space-2);
  color: var(--platform-color-text-secondary);
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
  border-top: 1px solid color-mix(in srgb, var(--platform-color-border) 65%, transparent);
}

.platform-page__meta-label {
  margin: 0 0 0.2rem;
  font-size: 0.7rem;
  color: var(--platform-color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.platform-page__meta-value {
  margin: 0;
  color: var(--platform-color-text-secondary);
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
  gap: var(--platform-space-5);
}

.platform-page__application-card {
  border: 1px solid color-mix(in srgb, var(--platform-color-border) 75%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--platform-color-surface) 94%, #fff 6%) 0%,
    var(--platform-color-surface) 100%
  );
  padding: var(--platform-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--platform-space-3);
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
  box-shadow: 0 8px 20px rgba(18, 28, 45, 0.08);
}

.platform-page__application-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--platform-color-primary) 25%, var(--platform-color-border));
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
  font-size: 1.2rem;
  line-height: 1.2;
  color: color-mix(in srgb, var(--platform-color-primary) 24%, var(--platform-color-text-primary));
}

.platform-page__row-description {
  margin: var(--platform-space-1) 0 0;
  color: var(--platform-color-text-tertiary);
  font-size: 0.95rem;
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

  .platform-page__row-title {
    font-size: 1.05rem;
  }
}
</style>
