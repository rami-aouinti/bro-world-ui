<script setup lang="ts">
import { computed, ref } from 'vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

interface FaqCategory {
  key: string
  label: string
  color: string
  description: string
}

interface FaqItem {
  category: string
  question: string
  answer: string
  detailsParagraphs: string[]
  bullets: string[]
}

interface FaqEmptyState {
  title: string
  description: string
  suggestion: string
}

const { t, tm } = useI18n()

const search = ref('')
const selectedCategory = ref('all')

const categories = computed(() => tm('faq.categories') as FaqCategory[])
const faqItems = computed(() => tm('faq.items') as FaqItem[])
const emptyState = computed(() => tm('faq.emptyState') as FaqEmptyState)

const filteredFaqItems = computed(() => faqItems.value.filter((item) => {
  const query = search.value.trim().toLowerCase()
  const inCategory = selectedCategory.value === 'all' || item.category === selectedCategory.value

  if (!query) {
    return inCategory
  }

  const matchesText = [
    item.question,
    item.answer,
    ...item.detailsParagraphs,
    ...item.bullets,
  ].join(' ').toLowerCase().includes(query)

  return inCategory && matchesText
}))

const categoryLabel = (key: string) => categories.value.find((category) => category.key === key)?.label ?? key
</script>

<template>
  <UiPageSection max-width="1100">
    <v-fade-transition appear>
      <v-card class="pa-6 pa-md-8 mb-6 transition-elevation" elevation="4" rounded="xl" hover>
        <v-chip color="primary" variant="tonal" class="mb-4">{{ t('faq.hero.badge') }}</v-chip>
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ t('faq.hero.title') }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">{{ t('faq.hero.subtitle') }}</p>
        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary">{{ t('faq.hero.primaryCta') }}</v-btn>
          <v-btn variant="outlined">{{ t('faq.hero.secondaryCta') }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>

    <v-card class="pa-5 mb-4" rounded="xl">
      <v-row dense>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            :label="t('faq.search.label')"
            :placeholder="t('faq.search.placeholder')"
            variant="outlined"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" md="4" class="d-flex align-center flex-wrap ga-2">
          <v-chip
            v-for="category in categories"
            :key="category.key"
            :color="selectedCategory === category.key ? category.color : undefined"
            :variant="selectedCategory === category.key ? 'flat' : 'outlined'"
            class="cursor-pointer"
            @click="selectedCategory = category.key"
          >
            {{ category.label }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card>

    <v-expand-transition>
      <v-expansion-panels v-if="filteredFaqItems.length" multiple>
        <v-expansion-panel
          v-for="(item, index) in filteredFaqItems"
          :key="`${item.question}-${index}`"
          class="mb-2"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center ga-3">
              <v-chip size="small" variant="tonal">{{ categoryLabel(item.category) }}</v-chip>
              <span>{{ item.question }}</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="mb-2">{{ item.answer }}</p>
            <p v-for="paragraph in item.detailsParagraphs" :key="`${item.question}-${paragraph}`" class="mb-2 text-body-2 text-medium-emphasis">
              {{ paragraph }}
            </p>
            <ul class="text-body-2 ps-5 mb-0">
              <li v-for="bullet in item.bullets" :key="`${item.question}-${bullet}`">{{ bullet }}</li>
            </ul>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-card v-else class="pa-5" rounded="xl" variant="outlined">
        <h2 class="text-h6 mb-2">{{ emptyState.title }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-2">{{ emptyState.description }}</p>
        <p class="text-caption text-medium-emphasis mb-0">{{ emptyState.suggestion }}</p>
      </v-card>
    </v-expand-transition>
  </UiPageSection>
</template>
