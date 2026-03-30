<script setup lang="ts">
import { computed, ref } from "vue";
import BeloteGame from "~/components/games/BeloteGame.vue";
import CheckersGame from "~/components/games/CheckersGame.vue";
import ChessGame from "~/components/games/ChessGame.vue";
import RamiGame from "~/components/games/RamiGame.vue";
import PokerGame from "~/components/games/PokerGame.vue";
import NonogramGame from "~/components/games/NonogramGame.vue";
import HiddenWordGame from "~/components/games/HiddenWordGame.vue";
import SudokuGame from "~/components/games/SudokuGame.vue";
import Game2048 from "~/components/games/Game2048.vue";
import GameMatchAside from "~/components/games/GameMatchAside.vue";
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";
import type {
  BeloteMode,
  GameCategory,
  GameEntry,
  PlayMode,
} from "~/types/game";

const { t } = useI18n();

definePageMeta({
  splitShell: false,
});

const categories: GameCategory[] = [
  {
    id: "cards",
    nameKey: "gamePage.catalog.categories.cards.name",
    descriptionKey: "gamePage.catalog.categories.cards.description",
    icon: "mdi-cards-playing-outline",
    subCategories: [
      {
        id: "classic-cards",
        nameKey: "gamePage.catalog.subCategories.classicCards.name",
        descriptionKey: "gamePage.catalog.subCategories.classicCards.description",
        icon: "mdi-cards-outline",
        games: [
          {
            id: "rami",
            nameKey: "gamePage.catalog.games.rami.name",
            descriptionKey: "gamePage.catalog.games.rami.description",
            icon: "mdi-cards-diamond-outline",
            component: "rami",
            supportedModes: ["ai", "pvp"],
          },
          {
            id: "belote",
            nameKey: "gamePage.catalog.games.belote.name",
            descriptionKey: "gamePage.catalog.games.belote.description",
            icon: "mdi-cards-club-outline",
            component: "belote",
            supportedModes: ["ai"],
          },
          {
            id: "poker",
            nameKey: "gamePage.catalog.games.poker.name",
            descriptionKey: "gamePage.catalog.games.poker.description",
            icon: "mdi-cards-spade-outline",
            component: "poker",
            supportedModes: ["ai"],
          },
        ],
      },
    ],
  },
  {
    id: "board",
    nameKey: "gamePage.catalog.categories.board.name",
    descriptionKey: "gamePage.catalog.categories.board.description",
    icon: "mdi-checkerboard",
    subCategories: [
      {
        id: "table-classic",
        nameKey: "gamePage.catalog.subCategories.tableClassic.name",
        descriptionKey: "gamePage.catalog.subCategories.tableClassic.description",
        icon: "mdi-gamepad-round-outline",
        games: [
          {
            id: "checkers",
            nameKey: "gamePage.catalog.games.checkers.name",
            descriptionKey: "gamePage.catalog.games.checkers.description",
            icon: "mdi-circle-multiple-outline",
            component: "checkers",
            supportedModes: ["ai", "pvp"],
          },
        ],
      },
    ],
  },
  {
    id: "smart-games",
    nameKey: "gamePage.catalog.categories.smartGames.name",
    descriptionKey: "gamePage.catalog.categories.smartGames.description",
    icon: "mdi-brain",
    subCategories: [
      {
        id: "logic",
        nameKey: "gamePage.catalog.subCategories.logic.name",
        descriptionKey: "gamePage.catalog.subCategories.logic.description",
        icon: "mdi-lightbulb-on-outline",
        games: [
          {
            id: "sudoku",
            categoryKey: "gamePage.catalog.categories.smartGames.name",
            subcategoryKey: "gamePage.catalog.subCategories.logic.name",
            difficultyKey: "gamePage.catalog.difficulties.medium",
            tags: [
              "gamePage.catalog.games.sudoku.meta.tags.logic",
              "gamePage.catalog.games.sudoku.meta.tags.puzzle",
              "gamePage.catalog.games.sudoku.meta.tags.daily",
              "gamePage.catalog.games.sudoku.meta.tags.solo",
              "gamePage.catalog.games.sudoku.meta.tags.timer",
              "gamePage.catalog.games.sudoku.meta.tags.score",
            ],
            nameKey: "gamePage.catalog.games.sudoku.name",
            descriptionKey: "gamePage.catalog.games.sudoku.description",
            icon: "mdi-grid",
            component: "sudoku",
            supportedModes: ["ai"],
            features: [
              "gamePage.catalog.games.sudoku.meta.features.gridGeneration",
              "gamePage.catalog.games.sudoku.meta.features.autoCheck",
              "gamePage.catalog.games.sudoku.meta.features.timerAndScore",
            ],
          },
          {
            id: "game-2048",
            categoryKey: "gamePage.catalog.categories.smartGames.name",
            subcategoryKey: "gamePage.catalog.subCategories.logic.name",
            difficultyKey: "gamePage.catalog.difficulties.easy",
            tags: [
              "gamePage.catalog.games.game2048.meta.tags.logic",
              "gamePage.catalog.games.game2048.meta.tags.strategy",
              "gamePage.catalog.games.game2048.meta.tags.puzzle",
              "gamePage.catalog.games.game2048.meta.tags.solo",
              "gamePage.catalog.games.game2048.meta.tags.score",
            ],
            nameKey: "gamePage.catalog.games.game2048.name",
            descriptionKey: "gamePage.catalog.games.game2048.description",
            icon: "mdi-numeric-8-box-multiple-outline",
            component: "game2048",
            supportedModes: ["ai"],
            features: [
              "gamePage.catalog.games.game2048.meta.features.smoothAnimations",
              "gamePage.catalog.games.game2048.meta.features.scoreAndBest",
              "gamePage.catalog.games.game2048.meta.features.sessionSave",
            ],
          },
        ],
      },
      {
        id: "strategy",
        nameKey: "gamePage.catalog.subCategories.strategy.name",
        descriptionKey: "gamePage.catalog.subCategories.strategy.description",
        icon: "mdi-chess-king",
        games: [
          {
            id: "chess",
            categoryKey: "gamePage.catalog.categories.smartGames.name",
            subcategoryKey: "gamePage.catalog.subCategories.strategy.name",
            difficultyKey: "gamePage.catalog.difficulties.hard",
            tags: [
              "gamePage.catalog.games.chess.meta.tags.strategy",
              "gamePage.catalog.games.chess.meta.tags.solo",
              "gamePage.catalog.games.chess.meta.tags.multiplayer",
              "gamePage.catalog.games.chess.meta.tags.oneVsOne",
              "gamePage.catalog.games.chess.meta.tags.ai",
              "gamePage.catalog.games.chess.meta.tags.replay",
            ],
            nameKey: "gamePage.catalog.games.chess.name",
            descriptionKey: "gamePage.catalog.games.chess.description",
            icon: "mdi-chess-knight",
            component: "chess",
            supportedModes: ["ai", "pvp"],
            features: [
              "gamePage.catalog.games.chess.meta.features.ai",
              "gamePage.catalog.games.chess.meta.features.multiplayer",
              "gamePage.catalog.games.chess.meta.features.replay",
            ],
          },
        ],
      },
      {
        id: "words-language",
        nameKey: "gamePage.catalog.subCategories.wordsLanguage.name",
        descriptionKey: "gamePage.catalog.subCategories.wordsLanguage.description",
        icon: "mdi-alphabetical-variant",
        games: [
          {
            id: "hidden-word",
            categoryKey: "gamePage.catalog.categories.smartGames.name",
            subcategoryKey: "gamePage.catalog.subCategories.wordsLanguage.name",
            difficultyKey: "gamePage.catalog.difficulties.medium",
            tags: [
              "gamePage.catalog.games.hiddenWord.meta.tags.words",
              "gamePage.catalog.games.hiddenWord.meta.tags.daily",
              "gamePage.catalog.games.hiddenWord.meta.tags.puzzle",
              "gamePage.catalog.games.hiddenWord.meta.tags.solo",
              "gamePage.catalog.games.hiddenWord.meta.tags.hints",
              "gamePage.catalog.games.hiddenWord.meta.tags.share",
            ],
            nameKey: "gamePage.catalog.games.hiddenWord.name",
            descriptionKey: "gamePage.catalog.games.hiddenWord.description",
            icon: "mdi-text-search-variant",
            component: "hidden-word",
            supportedModes: ["ai"],
            features: [
              "gamePage.catalog.games.hiddenWord.meta.features.wordOfTheDay",
              "gamePage.catalog.games.hiddenWord.meta.features.dictionary",
              "gamePage.catalog.games.hiddenWord.meta.features.share",
            ],
          },
        ],
      },
      {
        id: "grids-puzzles",
        nameKey: "gamePage.catalog.subCategories.gridsPuzzles.name",
        descriptionKey: "gamePage.catalog.subCategories.gridsPuzzles.description",
        icon: "mdi-grid-large",
        games: [
          {
            id: "nonogram",
            categoryKey: "gamePage.catalog.categories.smartGames.name",
            subcategoryKey: "gamePage.catalog.subCategories.gridsPuzzles.name",
            difficultyKey: "gamePage.catalog.difficulties.hard",
            tags: [
              "gamePage.catalog.games.nonogram.meta.tags.logic",
              "gamePage.catalog.games.nonogram.meta.tags.puzzle",
              "gamePage.catalog.games.nonogram.meta.tags.grid",
              "gamePage.catalog.games.nonogram.meta.tags.solo",
              "gamePage.catalog.games.nonogram.meta.tags.deduction",
            ],
            nameKey: "gamePage.catalog.games.nonogram.name",
            descriptionKey: "gamePage.catalog.games.nonogram.description",
            icon: "mdi-view-grid-plus-outline",
            component: "nonogram",
            supportedModes: ["ai"],
            features: [
              "gamePage.catalog.games.nonogram.meta.features.rowColumnHints",
              "gamePage.catalog.games.nonogram.meta.features.progressiveLevels",
            ],
          },
        ],
      },
    ],
  },
];

const selectedCategoryId = ref<string | null>(null);
const selectedSubCategoryId = ref<string | null>(null);
const selectedGameId = ref<string | null>(null);
const selectedPlayMode = ref<PlayMode | null>(null);
const selectedBeloteMode = ref<BeloteMode | null>(null);
const isGameStarted = ref(false);
const allGameEntries = computed(() =>
  categories.flatMap((category) =>
    category.subCategories.flatMap((subCategory) => subCategory.games),
  ),
);

const selectedCategory = computed(
  () =>
    categories.find((category) => category.id === selectedCategoryId.value) ??
    null,
);
const selectedSubCategory = computed(
  () =>
    selectedCategory.value?.subCategories.find(
      (sub) => sub.id === selectedSubCategoryId.value,
    ) ?? null,
);
const selectedGame = computed(
  () =>
    selectedSubCategory.value?.games.find(
      (game) => game.id === selectedGameId.value,
    ) ?? null,
);
const canLaunchSelectedGame = computed(
  () => {
    const hasPlayableMode =
      Boolean(selectedPlayMode.value) &&
      Boolean(
        selectedPlayMode.value &&
          selectedGame.value?.supportedModes.includes(selectedPlayMode.value),
      );

    if (!selectedGame.value?.component || !hasPlayableMode) return false;

    if (selectedGame.value.id === "belote") {
      return Boolean(selectedBeloteMode.value);
    }

    return true;
  },
);

const modeLabel = (mode: PlayMode) =>
  mode === "ai"
    ? t("gamePage.modes.vsComputer")
    : t("gamePage.modes.vsPlayer");

const gameStatusLabel = computed(() => {
  if (!selectedGame.value) return t("gamePage.status.none");

  if (isGameStarted.value) return t("gamePage.status.inProgress");

  if (canLaunchSelectedGame.value) return t("gamePage.status.ready");

  return t("gamePage.status.selecting");
});

const getLevelColor = (
  level: "category" | "subCategory" | "game" | "mode" | "info",
) => {
  if (level === "category") return "primary";
  if (level === "subCategory") return "secondary";
  if (level === "game") return "success";
  if (level === "mode") return "info";
  return "indigo";
};

const openCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId;
  selectedSubCategoryId.value = null;
  selectedGameId.value = null;
  selectedPlayMode.value = null;
  selectedBeloteMode.value = null;
  isGameStarted.value = false;
};

const openSubCategory = (subCategoryId: string) => {
  selectedSubCategoryId.value = subCategoryId;
  selectedGameId.value = null;
  selectedPlayMode.value = null;
  selectedBeloteMode.value = null;
  isGameStarted.value = false;
};

const openGame = (gameId: string) => {
  selectedGameId.value = gameId;
  selectedPlayMode.value = null;
  selectedBeloteMode.value = gameId === "belote" ? "teams" : null;
  isGameStarted.value = false;
};

const resetToCategories = () => {
  selectedCategoryId.value = null;
  selectedSubCategoryId.value = null;
  selectedGameId.value = null;
  selectedPlayMode.value = null;
  selectedBeloteMode.value = null;
  isGameStarted.value = false;
};

const selectPlayMode = (mode: PlayMode) => {
  if (!selectedGame.value?.supportedModes.includes(mode)) {
    return;
  }

  selectedPlayMode.value = mode;
  isGameStarted.value = false;
};

const selectBeloteMode = (mode: BeloteMode) => {
  if (selectedGame.value?.id !== "belote") return;
  selectedBeloteMode.value = mode;
  isGameStarted.value = false;
};

const launchGame = () => {
  if (!canLaunchSelectedGame.value) {
    return;
  }

  isGameStarted.value = true;
};

const gamePanelState = computed(() => ({
  gameStatusLabel: gameStatusLabel.value,
  canLaunchSelectedGame: canLaunchSelectedGame.value,
  selectedBeloteMode: selectedBeloteMode.value,
  modeLabel,
  getLevelColor,
  resetToCategories,
}));
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <div class="mb-4">
        <v-chip variant="outlined" prepend-icon="mdi-controller" class="mb-2">{{ t("gamePage.sidebar.badge") }}</v-chip>
        <h1 class="page-title mb-2">{{ t("gamePage.sidebar.title") }}</h1>
      </div>
      <div class="d-flex flex-column ga-2 mb-4">
        <v-btn variant="outlined" prepend-icon="mdi-home" @click="resetToCategories">{{ t("gamePage.navigation.backToCategories") }}</v-btn>
        <v-btn v-if="selectedGame" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedGameId = null">
          {{ t("gamePage.navigation.backToGames") }}
        </v-btn>
        <v-btn v-if="selectedSubCategory" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedSubCategoryId = null">
          {{ t("gamePage.navigation.backToSubCategories") }}
        </v-btn>
      </div>
      <div class="d-flex align-center flex-wrap ga-2 mb-0">
        <v-chip>{{ selectedPlayMode ? modeLabel(selectedPlayMode) : "—" }}</v-chip>
        <v-chip>{{ gameStatusLabel }}</v-chip>
        <v-chip v-if="selectedCategory" prepend-icon="mdi-folder-open-outline" :color="getLevelColor('category')">{{ t(selectedCategory.nameKey) }}</v-chip>
        <v-chip v-if="selectedSubCategory" prepend-icon="mdi-shape-outline" :color="getLevelColor('subCategory')">{{ t(selectedSubCategory.nameKey) }}</v-chip>
        <v-chip v-if="selectedGame" prepend-icon="mdi-play-circle-outline" :color="getLevelColor('game')">{{ t(selectedGame.nameKey) }}</v-chip>
      </div>
    </template>
    <template #aside>
      <GameMatchAside
        :selected-category="selectedCategory"
        :selected-sub-category="selectedSubCategory"
        :selected-game="selectedGame"
        :selected-play-mode="selectedPlayMode"
        :is-game-started="isGameStarted"
        :game-panel-state="gamePanelState"
      />
    </template>
    <template #default>
      <section v-if="!selectedCategory" class="mb-4">
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="category in categories"
            :key="category.id"
            cols="12"
            md="4"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex align-start ga-3">
                <v-avatar :color="getLevelColor('category')" variant="tonal"><v-icon :icon="category.icon" /></v-avatar>
                <div>
                  <h3 class="card-title mb-1">{{ t(category.nameKey) }}</h3>
                  <p class="card-description mb-3">
                    {{ t(category.descriptionKey) }}
                  </p>
                  <v-btn
                    :color="getLevelColor('category')"
                    variant="flat"
                    @click="openCategory(category.id)"
                    >{{ t("gamePage.actions.viewSubCategories") }}</v-btn
                  >
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <h2 class="card-title mb-3">{{ t("gamePage.labels.allGames") }}</h2>
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="game in allGameEntries"
            :key="`all-${game.id}`"
            cols="12"
            md="4"
            xl="3"
          >
            <v-card class="pa-4 h-100 unified-card" variant="outlined">
              <div class="d-flex flex-column ga-2 h-100">
                <v-avatar :color="getLevelColor('game')" variant="tonal"><v-icon :icon="game.icon" /></v-avatar>
                <h3 class="card-title mb-0">{{ t(game.nameKey) }}</h3>
                <p class="card-description mb-1">{{ t(game.descriptionKey) }}</p>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip v-if="game.categoryKey" size="x-small" variant="tonal" color="primary">{{ t(game.categoryKey) }}</v-chip>
                  <v-chip v-if="game.subcategoryKey" size="x-small" variant="tonal" color="secondary">{{ t(game.subcategoryKey) }}</v-chip>
                  <v-chip v-if="game.difficultyKey" size="x-small" variant="outlined" color="info">{{ t(game.difficultyKey) }}</v-chip>
                </div>
                <div v-if="game.features?.length" class="mt-1">
                  <p class="text-caption font-weight-bold mb-1">{{ t("gamePage.labels.features") }}</p>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip
                      v-for="feature in game.features"
                      :key="`${game.id}-feature-${feature}`"
                      size="x-small"
                      variant="tonal"
                      color="indigo"
                    >
                      {{ t(feature) }}
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section
        v-else-if="selectedCategory && !selectedSubCategory"
        class="mb-4"
      >
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="subCategory in selectedCategory.subCategories"
            :key="subCategory.id"
            cols="12"
            md="4"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex align-start ga-3">
                <v-avatar :color="getLevelColor('subCategory')" variant="tonal"><v-icon :icon="subCategory.icon" /></v-avatar>
                <div>
                  <h3 class="card-title mb-1">{{ t(subCategory.nameKey) }}</h3>
                  <p class="card-description mb-3">
                    {{ t(subCategory.descriptionKey) }}
                  </p>
                  <v-btn
                    :color="getLevelColor('subCategory')"
                    variant="flat"
                    @click="openSubCategory(subCategory.id)"
                    >{{ t("gamePage.actions.viewGames") }}</v-btn
                  >
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else-if="selectedSubCategory && !selectedGame" class="mb-4">
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="game in selectedSubCategory.games"
            :key="game.id"
            cols="12"
            md="4"
            xl="4"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex flex-column ga-2 h-100">
                <v-avatar :color="getLevelColor('game')" variant="tonal"><v-icon :icon="game.icon" /></v-avatar>
                <h3 class="card-title mb-0">{{ t(game.nameKey) }}</h3>
                <p class="card-description">{{ t(game.descriptionKey) }}</p>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip v-if="game.categoryKey" size="x-small" variant="tonal" color="primary">{{ t(game.categoryKey) }}</v-chip>
                  <v-chip v-if="game.subcategoryKey" size="x-small" variant="tonal" color="secondary">{{ t(game.subcategoryKey) }}</v-chip>
                  <v-chip v-if="game.difficultyKey" size="x-small" variant="outlined" color="info">{{ t(game.difficultyKey) }}</v-chip>
                  <v-chip
                    v-for="tag in game.tags ?? []"
                    :key="`${game.id}-${tag}`"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ t(tag) }}
                  </v-chip>
                </div>
                <div v-if="game.features?.length" class="mt-1">
                  <p class="text-caption font-weight-bold mb-1">{{ t("gamePage.labels.bonus") }}</p>
                  <ul class="info-list">
                    <li v-for="feature in game.features" :key="`${game.id}-bonus-${feature}`">
                      {{ t(feature) }}
                    </li>
                  </ul>
                </div>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="mode in game.supportedModes"
                    :key="`${game.id}-${mode}`"
                    size="small"
                    variant="tonal"
                    :color="getLevelColor('mode')"
                  >
                    {{ modeLabel(mode) }}
                  </v-chip>
                  <v-chip
                    v-if="!game.supportedModes.length"
                    size="small"
                    variant="outlined"
                    color="warning"
                  >
                    {{ t("gamePage.status.comingSoon") }}
                  </v-chip>
                </div>
                <v-spacer />
                <v-btn
                  :color="getLevelColor('game')"
                  variant="flat"
                  :disabled="!game.component || !game.supportedModes.length"
                  @click="openGame(game.id)"
                >
                  {{ game.component ? t("gamePage.actions.chooseGame") : t("gamePage.status.comingSoon") }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else-if="selectedGame && !isGameStarted" class="mb-1">
        <v-card class="pa-4 unified-card" variant="outlined">
          <div v-if="selectedGame.features?.length" class="mb-4">
            <h3 class="section-title mb-2">{{ t("gamePage.labels.features") }}</h3>
            <ul class="info-list">
              <li v-for="feature in selectedGame.features" :key="`selected-feature-${feature}`">
                {{ t(feature) }}
              </li>
            </ul>
          </div>

          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              :color="getLevelColor('mode')"
              :variant="selectedPlayMode === 'ai' ? 'flat' : 'outlined'"
              :disabled="!selectedGame.supportedModes.includes('ai')"
              @click="selectPlayMode('ai')"
            >
              {{ modeLabel("ai") }}
            </v-btn>
            <v-btn
              :color="getLevelColor('subCategory')"
              :variant="selectedPlayMode === 'pvp' ? 'flat' : 'outlined'"
              :disabled="!selectedGame.supportedModes.includes('pvp')"
              @click="selectPlayMode('pvp')"
            >
              {{ modeLabel("pvp") }}
            </v-btn>
          </div>

          <div v-if="selectedGame.id === 'belote'" class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              color="deep-purple"
              :variant="selectedBeloteMode === 'teams' ? 'flat' : 'outlined'"
              @click="selectBeloteMode('teams')"
            >
              Belote 2v2
            </v-btn>
            <v-btn
              color="deep-purple"
              :variant="selectedBeloteMode === 'free-for-all' ? 'flat' : 'outlined'"
              @click="selectBeloteMode('free-for-all')"
            >
              Belote free-for-all
            </v-btn>
          </div>

          <v-alert
            v-if="
              !selectedGame.supportedModes.length || !selectedGame.component
            "
            type="info"
            variant="tonal"
            class="mb-4"
          >
            {{ t("gamePage.status.soonHint") }}
          </v-alert>

          <v-btn
            :color="getLevelColor('game')"
            :disabled="!canLaunchSelectedGame"
            @click="launchGame"
          >
            {{ t("gamePage.actions.launchGame") }}
          </v-btn>
        </v-card>
      </section>

      <section v-else-if="selectedGame && selectedPlayMode && isGameStarted">
        <RamiGame
          v-if="selectedGame.component === 'rami'"
          :selected-play-mode="selectedPlayMode"
        />
        <BeloteGame
          v-else-if="selectedGame.component === 'belote'"
          :selected-play-mode="selectedPlayMode"
          :belote-mode="selectedBeloteMode ?? 'teams'"
        />
        <CheckersGame
          v-else-if="selectedGame.component === 'checkers'"
          :selected-play-mode="selectedPlayMode"
        />
        <PokerGame
          v-else-if="selectedGame.component === 'poker'"
          :selected-play-mode="selectedPlayMode"
        />
        <NonogramGame
          v-else-if="selectedGame.component === 'nonogram'"
         :selected-play-mode="selectedPlayMode"
        />               
        <HiddenWordGame
          v-else-if="selectedGame.component === 'hidden-word'"
         :selected-play-mode="selectedPlayMode"
        />                  
        <ChessGame
          v-else-if="selectedGame.component === 'chess'"
         :selected-play-mode="selectedPlayMode"
        />            
        <SudokuGame
          v-else-if="selectedGame.component === 'sudoku'"
          :selected-play-mode="selectedPlayMode"
        />            
        <Game2048
          v-else-if="selectedGame.component === 'game2048'"
          :selected-play-mode="selectedPlayMode"
        />
      </section>
    </template>
  </PlatformSplitLayout>
</template>

<style scoped>
.unified-shell,
.unified-card {
  border-radius: 18px;
  border: 1px solid
    color-mix(in srgb, rgb(var(--v-theme-primary)) 20%, transparent);
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0)
  );
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
}

.interactive-card {
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.interactive-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
}

.interactive-card:focus-within {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px
    color-mix(in srgb, rgb(var(--v-theme-primary)) 30%, transparent);
}

.page-title {
  font-size: clamp(1.6rem, 1.2rem + 1vw, 2.1rem);
  line-height: 1.2;
  font-weight: 800;
}

.section-title {
  font-size: clamp(1.1rem, 1rem + 0.4vw, 1.35rem);
  line-height: 1.3;
  font-weight: 700;
}

.section-subtitle {
  font-size: 0.95rem;
  color: rgba(var(--v-theme-on-surface), 0.76);
}

.card-title {
  font-size: 1.05rem;
  line-height: 1.3;
  font-weight: 700;
}

.card-description {
  font-size: 0.93rem;
  color: rgba(var(--v-theme-on-surface), 0.74);
}

.info-list {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.35rem;
}

@media (max-width: 959px) {
  .unified-shell,
  .unified-card {
    border-radius: 14px;
  }
}
</style>
