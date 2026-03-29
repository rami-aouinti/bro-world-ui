<script setup lang="ts">
import { computed, ref } from 'vue'
import BeloteGame from '~/components/games/BeloteGame.vue'
import CheckersGame from '~/components/games/CheckersGame.vue'
import RamiGame from '~/components/games/RamiGame.vue'

interface GameEntry {
  id: string
  name: string
  description: string
  icon: string
  component: 'rami' | 'belote' | 'checkers'
}

interface GameSubCategory {
  id: string
  name: string
  description: string
  icon: string
  games: GameEntry[]
}

interface GameCategory {
  id: string
  name: string
  description: string
  icon: string
  subCategories: GameSubCategory[]
}

const categories: GameCategory[] = [
  {
    id: 'cards',
    name: 'Jeux de cartes',
    description: 'Sélectionnez un jeu de cartes traditionnel puis jouez directement.',
    icon: 'mdi-cards-playing-outline',
    subCategories: [
      {
        id: 'classic-cards',
        name: 'Cartes classiques',
        description: 'Rami, Belote, et d\'autres jeux populaires.',
        icon: 'mdi-cards-outline',
        games: [
          {
            id: 'rami',
            name: 'Rami',
            description: 'Créez des suites ou brelans pour vider votre main.',
            icon: 'mdi-cards-diamond-outline',
            component: 'rami',
          },
          {
            id: 'belote',
            name: 'Belote',
            description: 'Version rapide en 8 plis contre une IA.',
            icon: 'mdi-cards-club-outline',
            component: 'belote',
          },
          {
            id: 'poker',
            name: 'Poker (bientôt)',
            description: 'Mode Texas Hold\'em à venir prochainement.',
            icon: 'mdi-cards-spade-outline',
            component: 'belote',
          },
        ],
      },
    ],
  },
  {
    id: 'board',
    name: 'Jeux de table',
    description: 'Des jeux de plateau simples et conviviaux.',
    icon: 'mdi-checkerboard',
    subCategories: [
      {
        id: 'table-classic',
        name: 'Classiques de table',
        description: 'Commencez avec le jeu de dames complet.',
        icon: 'mdi-gamepad-round-outline',
        games: [
          {
            id: 'checkers',
            name: 'Dames',
            description: 'Jeu de dames local 2 joueurs sur le même écran.',
            icon: 'mdi-circle-multiple-outline',
            component: 'checkers',
          },
        ],
      },
    ],
  },
]

const selectedCategoryId = ref<string | null>(null)
const selectedSubCategoryId = ref<string | null>(null)
const selectedGameId = ref<string | null>(null)

const selectedCategory = computed(() => categories.find(category => category.id === selectedCategoryId.value) ?? null)
const selectedSubCategory = computed(() => selectedCategory.value?.subCategories.find(sub => sub.id === selectedSubCategoryId.value) ?? null)
const selectedGame = computed(() => selectedSubCategory.value?.games.find(game => game.id === selectedGameId.value) ?? null)

const openCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId
  selectedSubCategoryId.value = null
  selectedGameId.value = null
}

const openSubCategory = (subCategoryId: string) => {
  selectedSubCategoryId.value = subCategoryId
  selectedGameId.value = null
}

const openGame = (gameId: string) => {
  selectedGameId.value = gameId
}

const resetToCategories = () => {
  selectedCategoryId.value = null
  selectedSubCategoryId.value = null
  selectedGameId.value = null
}
</script>

<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <v-card class="pa-5 pa-md-7 rounded-xl game-page-hero" variant="tonal">
          <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
            <div>
              <v-chip variant="outlined" prepend-icon="mdi-controller" class="mb-2">Game Center</v-chip>
              <h1 class="text-h4 font-weight-bold mb-2">Espace Jeux</h1>
              <p class="text-body-1 text-medium-emphasis mb-0">Choisissez une catégorie, puis une sous-catégorie, puis lancez votre jeu.</p>
            </div>
            <v-btn variant="outlined" prepend-icon="mdi-home" @click="resetToCategories">Retour catégories</v-btn>
          </div>

          <div class="d-flex align-center flex-wrap ga-2 mb-6">
            <v-chip v-if="selectedCategory" prepend-icon="mdi-folder-open-outline" color="primary">{{ selectedCategory.name }}</v-chip>
            <v-chip v-if="selectedSubCategory" prepend-icon="mdi-shape-outline" color="secondary">{{ selectedSubCategory.name }}</v-chip>
            <v-chip v-if="selectedGame" prepend-icon="mdi-play-circle-outline" color="success">{{ selectedGame.name }}</v-chip>
          </div>

          <section v-if="!selectedCategory" class="mb-4">
            <h2 class="text-h6 mb-3">1) Catégories</h2>
            <v-row>
              <v-col v-for="category in categories" :key="category.id" cols="12" md="6">
                <v-card class="pa-4 h-100" variant="outlined">
                  <div class="d-flex align-start ga-3">
                    <v-avatar color="primary" variant="tonal"><v-icon :icon="category.icon" /></v-avatar>
                    <div>
                      <h3 class="text-h6 mb-1">{{ category.name }}</h3>
                      <p class="text-body-2 text-medium-emphasis mb-3">{{ category.description }}</p>
                      <v-btn color="primary" variant="flat" @click="openCategory(category.id)">Voir sous-catégories</v-btn>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </section>

          <section v-else-if="selectedCategory && !selectedSubCategory" class="mb-4">
            <h2 class="text-h6 mb-3">2) Sous-catégories · {{ selectedCategory.name }}</h2>
            <v-row>
              <v-col v-for="subCategory in selectedCategory.subCategories" :key="subCategory.id" cols="12" md="6">
                <v-card class="pa-4 h-100" variant="outlined">
                  <div class="d-flex align-start ga-3">
                    <v-avatar color="secondary" variant="tonal"><v-icon :icon="subCategory.icon" /></v-avatar>
                    <div>
                      <h3 class="text-h6 mb-1">{{ subCategory.name }}</h3>
                      <p class="text-body-2 text-medium-emphasis mb-3">{{ subCategory.description }}</p>
                      <v-btn color="secondary" variant="flat" @click="openSubCategory(subCategory.id)">Voir les jeux</v-btn>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </section>

          <section v-else-if="selectedSubCategory && !selectedGame" class="mb-4">
            <h2 class="text-h6 mb-3">3) Jeux · {{ selectedSubCategory.name }}</h2>
            <v-row>
              <v-col v-for="game in selectedSubCategory.games" :key="game.id" cols="12" md="6" lg="4">
                <v-card class="pa-4 h-100" variant="outlined">
                  <div class="d-flex flex-column ga-2 h-100">
                    <v-avatar color="success" variant="tonal"><v-icon :icon="game.icon" /></v-avatar>
                    <h3 class="text-h6 mb-0">{{ game.name }}</h3>
                    <p class="text-body-2 text-medium-emphasis">{{ game.description }}</p>
                    <v-spacer />
                    <v-btn color="success" variant="flat" @click="openGame(game.id)">Lancer le jeu</v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </section>

          <section v-else-if="selectedGame">
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-btn size="small" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedGameId = null">Retour jeux</v-btn>
              <v-btn size="small" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedSubCategoryId = null">Retour sous-catégories</v-btn>
            </div>

            <RamiGame v-if="selectedGame.component === 'rami'" />
            <BeloteGame v-else-if="selectedGame.component === 'belote'" />
            <CheckersGame v-else-if="selectedGame.component === 'checkers'" />
          </section>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.game-page-hero {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}
</style>
