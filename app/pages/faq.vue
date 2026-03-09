<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
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

interface FaqHero {
  badge: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
}

interface FaqSearch {
  label: string
  placeholder: string
}

interface FaqPagePayload {
  hero: FaqHero
  search: FaqSearch
  categories: FaqCategory[]
  items: FaqItem[]
  emptyState: FaqEmptyState
}

// Mock de réponse API (GET /api/public/pages/faq)
const faqPagePayload = ref<FaqPagePayload>({
  hero: {
    badge: 'FAQ',
    title: 'Questions fréquentes',
    subtitle: 'Toutes les informations de cette page sont simulées via JSON local.',
    primaryCta: 'Contacter le support',
    secondaryCta: 'Voir la documentation',
  },
  search: {
    label: 'Rechercher une question',
    placeholder: 'Ex: facturation, sécurité, délais…',
  },
  categories: [
    { key: 'all', label: 'Toutes', color: 'primary', description: 'Toutes les catégories' },
    { key: 'billing', label: 'Facturation', color: 'indigo', description: 'Paiements, abonnements, factures' },
    { key: 'security', label: 'Sécurité', color: 'teal', description: 'Protection des données et accès' },
    { key: 'product', label: 'Produit', color: 'deep-orange', description: 'Fonctionnalités et roadmap' },
  ],
  items: [
    {
      category: 'billing',
      question: 'Comment récupérer une facture ?',
      answer: 'Les factures sont disponibles depuis votre espace admin.',
      detailsParagraphs: ['Chaque facture est exportable en PDF.', 'Un email de confirmation est envoyé à chaque paiement.'],
      bullets: ['Format PDF', 'Historique complet', 'Téléchargement immédiat'],
    },
    {
      category: 'security',
      question: 'Comment fonctionne la gestion des accès ?',
      answer: 'Vous pouvez créer des rôles avec permissions granulaires.',
      detailsParagraphs: ['Le backend devra renvoyer rôles et permissions disponibles.'],
      bullets: ['Rôles personnalisés', 'Audit logs', 'MFA en option'],
    },
  ],
  emptyState: {
    title: 'Aucun résultat',
    description: 'Aucune FAQ ne correspond à votre recherche.',
    suggestion: 'Essayez un autre mot-clé ou changez de catégorie.',
  },
})

const search = ref('')
const selectedCategory = ref('all')

const filteredFaqItems = computed(() => faqPagePayload.value.items.filter((item) => {
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

const categoryLabel = (key: string) => faqPagePayload.value.categories.find((category) => category.key === key)?.label ?? key
</script>

<template>
  <main class="faq-page">
    <v-fade-transition appear>
      <v-card class="faq-hero__surface mb-6 transition-elevation" elevation="4" rounded="xl" hover>
        <v-chip class="faq-hero__badge" color="primary" variant="tonal">{{ faqPagePayload.hero.badge }}</v-chip>
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ faqPagePayload.hero.title }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-6">{{ faqPagePayload.hero.subtitle }}</p>
        <div class="d-flex flex-wrap ga-3">
          <v-btn color="primary">{{ faqPagePayload.hero.primaryCta }}</v-btn>
          <v-btn variant="outlined">{{ faqPagePayload.hero.secondaryCta }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>

    <v-card class="faq-filters mb-4" rounded="xl">
      <v-row dense>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            :label="faqPagePayload.search.label"
            :placeholder="faqPagePayload.search.placeholder"
            variant="outlined"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" md="4" class="faq-filters__chips d-flex align-center flex-wrap ga-2">
          <v-chip
            v-for="category in faqPagePayload.categories"
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
      <section class="faq-panels">
        <v-expansion-panels v-if="filteredFaqItems.length" class="faq-panels__list" multiple>
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
          <h2 class="text-h6 mb-2">{{ faqPagePayload.emptyState.title }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-2">{{ faqPagePayload.emptyState.description }}</p>
          <p class="text-caption text-medium-emphasis mb-0">{{ faqPagePayload.emptyState.suggestion }}</p>
        </v-card>
      </section>
    </v-expand-transition>
  </main>
</template>
<style scoped>
.faq-page {
  padding: 3.5rem;
}
</style>
