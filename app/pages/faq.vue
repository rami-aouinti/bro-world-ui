<script setup lang="ts">
import { usePublicPagesStore } from "~/stores/publicPages";

import { computed, ref } from "vue";

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
});

useHead({
  title: 'Faq',
})

interface FaqCategory {
  key: string;
  label: string;
  color: string;
  description: string;
}

interface FaqItem {
  category: string;
  question: string;
  answer: string;
  detailsParagraphs: string[];
  bullets: string[];
}

interface FaqEmptyState {
  title: string;
  description: string;
  suggestion: string;
}

interface FaqHero {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}

interface FaqSearch {
  label: string;
  placeholder: string;
}

interface FaqPagePayload {
  hero: FaqHero;
  search: FaqSearch;
  categories: FaqCategory[];
  items: FaqItem[];
  emptyState: FaqEmptyState;
}

const publicPagesStore = usePublicPagesStore();
const { locale, t } = useI18n();

// Mock API response (GET /api/public/pages/faq)
const faqPagePayload = ref<FaqPagePayload>({
  hero: {
    badge: "FAQ",
    title: t("faq.hero.title"),
    subtitle: t("faq.hero.subtitle"),
    primaryCta: t("faq.hero.primaryCta"),
    secondaryCta: t("faq.hero.secondaryCta"),
  },
  search: {
    label: t("faq.search.label"),
    placeholder: t("faq.search.placeholder"),
  },
  categories: [
    {
      key: "all",
      label: "All",
      color: "primary",
      description: "All categories",
    },
    {
      key: "billing",
      label: t("faq.categories.1.label"),
      color: "indigo",
      description: t("faq.categories.1.description"),
    },
    {
      key: "security",
      label: "Security",
      color: "teal",
      description: "Data and access protection",
    },
    {
      key: "product",
      label: "Product",
      color: "deep-orange",
      description: "Features and roadmap",
    },
  ],
  items: [
    {
      category: "billing",
      question: "How do I retrieve an invoice?",
      answer: t("faq.items.0.answer"),
      detailsParagraphs: [
        "Each invoice can be exported as PDF.",
        "A confirmation email is sent for each payment.",
      ],
      bullets: ["Format PDF", "Complete history", "Instant download"],
    },
    {
      category: "security",
      question: "How does access management work?",
      answer: "You can create roles with granular permissions.",
      detailsParagraphs: [
        "The backend must return available roles and permissions.",
      ],
      bullets: [
        t("faq.items.2.bullets.0"),
        t("faq.items.2.bullets.1"),
        t("faq.items.2.bullets.2"),
      ],
    },
  ],
  emptyState: {
    title: t("faq.emptyState.title"),
    description: t("faq.emptyState.description"),
    suggestion: t("faq.emptyState.suggestion"),
  },
});

const search = ref("");
const selectedCategory = ref("all");

const filteredFaqItems = computed(() =>
  faqPagePayload.value.items.filter((item) => {
    const query = search.value.trim().toLowerCase();
    const inCategory =
      selectedCategory.value === "all" ||
      item.category === selectedCategory.value;

    if (!query) {
      return inCategory;
    }

    const matchesText = [
      item.question,
      item.answer,
      ...item.detailsParagraphs,
      ...item.bullets,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

    return inCategory && matchesText;
  }),
);

const categoryLabel = (key: string) =>
  faqPagePayload.value.categories.find((category) => category.key === key)
    ?.label ?? key;

const isLoading = ref(true);

const loadPageContent = async () => {
  isLoading.value = true;
  try {
    faqPagePayload.value = await publicPagesStore.loadFaq(locale.value);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadPageContent);
watch(locale, loadPageContent);
</script>

<template>
  <main class="faq-page">
    <template v-if="isLoading">
      <v-card class="faq-hero__surface mb-6" rounded="xl">
        <v-skeleton-loader type="chip" class="mb-3" />
        <v-skeleton-loader type="heading" class="mb-2" />
        <v-skeleton-loader type="text@2" class="mb-4" />
        <v-skeleton-loader type="button@2" />
      </v-card>
      <v-card class="faq-filters mb-4" rounded="xl">
        <v-skeleton-loader type="text@2" />
      </v-card>
      <v-skeleton-loader type="list-item-three-line@4" />
    </template>

    <template v-else>
      <v-fade-transition appear>
        <v-card
          class="faq-hero__surface mb-6 transition-elevation"
          elevation="4"
          rounded="xl"
          hover
        >
          <v-chip class="faq-hero__badge" color="primary" variant="tonal">{{
            faqPagePayload.hero.badge
          }}</v-chip>
          <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">
            {{ faqPagePayload.hero.title }}
          </h1>
          <p class="text-body-1 faq-muted-text mb-6">
            {{ faqPagePayload.hero.subtitle }}
          </p>
          <div class="d-flex flex-wrap ga-3">
            <v-btn color="primary">{{ faqPagePayload.hero.primaryCta }}</v-btn>
            <v-btn variant="outlined">{{
              faqPagePayload.hero.secondaryCta
            }}</v-btn>
          </div>
        </v-card>
      </v-fade-transition>

      <v-card class="faq-filters mb-4" rounded="xl">
        <v-row density="comfortable">
          <v-col cols="12" md="8">
            <v-text-field
              v-model="search"
              class="faq-search-field"
              prepend-inner-icon="mdi-magnify"
              :label="faqPagePayload.search.label"
              :placeholder="faqPagePayload.search.placeholder"
              variant="outlined"
              hide-details
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
            class="faq-filters__chips d-flex align-center flex-wrap ga-2"
          >
            <v-chip
              v-for="category in faqPagePayload.categories"
              :key="category.key"
              :color="
                selectedCategory === category.key ? category.color : undefined
              "
              :variant="selectedCategory === category.key ? 'flat' : 'outlined'"
              class="cursor-pointer faq-category-chip"
              @click="selectedCategory = category.key"
            >
              {{ category.label }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card>

      <v-expand-transition>
        <section class="faq-panels">
          <v-expansion-panels
            v-if="filteredFaqItems.length"
            class="faq-panels__list"
            multiple
          >
            <v-expansion-panel
              v-for="(item, index) in filteredFaqItems"
              :key="`${item.question}-${index}`"
              class="mb-2"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center ga-3">
                  <v-chip size="small" variant="tonal">{{
                    categoryLabel(item.category)
                  }}</v-chip>
                  <span>{{ item.question }}</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p class="mb-2">{{ item.answer }}</p>
                <p
                  v-for="paragraph in item.detailsParagraphs"
                  :key="`${item.question}-${paragraph}`"
                  class="mb-2 text-body-2 faq-muted-text"
                >
                  {{ paragraph }}
                </p>
                <ul class="text-body-2 ps-5 mb-0">
                  <li
                    v-for="bullet in item.bullets"
                    :key="`${item.question}-${bullet}`"
                  >
                    {{ bullet }}
                  </li>
                </ul>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-card v-else class="pa-5" rounded="xl" variant="outlined">
            <h2 class="text-h6 mb-2">{{ faqPagePayload.emptyState.title }}</h2>
            <p class="text-body-2 faq-muted-text mb-2">
              {{ faqPagePayload.emptyState.description }}
            </p>
            <p class="text-caption faq-muted-text mb-0">
              {{ faqPagePayload.emptyState.suggestion }}
            </p>
          </v-card>
        </section>
      </v-expand-transition>
    </template>
  </main>
</template>
<style scoped>
.faq-hero__surface {
  padding: 1rem;
}
.faq-page {
  padding: 3.5rem;
  --v-medium-emphasis-opacity: 0.87;
}

.faq-muted-text {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.87;
}

.faq-search-field :deep(.v-label),
.faq-search-field :deep(.v-field__input),
.faq-search-field :deep(.v-field__prepend-inner .v-icon) {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.87;
}

.faq-category-chip:deep(.v-chip__content) {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.9;
}
</style>
