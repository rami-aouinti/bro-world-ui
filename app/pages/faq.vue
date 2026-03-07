<script setup lang="ts">
import { computed, ref } from 'vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()

const search = ref('')
const selectedCategory = ref('all')

const categories = [
  { key: 'all', color: 'primary' },
  { key: 'account', color: 'info' },
  { key: 'platform', color: 'success' },
  { key: 'security', color: 'warning' },
]

const faqItems = computed(() => [
  { key: 'q1', category: 'account' },
  { key: 'q2', category: 'platform' },
  { key: 'q3', category: 'security' },
  { key: 'q4', category: 'platform' },
])

const filteredFaqItems = computed(() => faqItems.value.filter((item) => {
  const query = search.value.trim().toLowerCase()
  const inCategory = selectedCategory.value === 'all' || item.category === selectedCategory.value

  if (!query) {
    return inCategory
  }

  return inCategory && (
    t(`faq.items.${item.key}.question`).toLowerCase().includes(query)
    || t(`faq.items.${item.key}.answer`).toLowerCase().includes(query)
  )
}))
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
            {{ t(`faq.categories.${category.key}`) }}
          </v-chip>
        </v-col>
      </v-row>
    </v-card>

    <v-expand-transition>
      <v-expansion-panels multiple>
        <v-expansion-panel
          v-for="item in filteredFaqItems"
          :key="item.key"
          class="mb-2"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center ga-3">
              <v-chip size="small" variant="tonal">{{ t(`faq.categories.${item.category}`) }}</v-chip>
              <span>{{ t(`faq.items.${item.key}.question`) }}</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="mb-0">{{ t(`faq.items.${item.key}.answer`) }}</p>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expand-transition>

    <v-fade-transition>
      <v-card class="pa-5 mt-6" rounded="xl" variant="tonal">
        <h2 class="text-h6 mb-2">{{ t('faq.contactCta.title') }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">{{ t('faq.contactCta.description') }}</p>
        <v-btn color="primary">{{ t('faq.contactCta.action') }}</v-btn>
      </v-card>
    </v-fade-transition>
  </UiPageSection>
</template>
