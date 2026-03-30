<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BeloteGame from "~/components/games/BeloteGame.vue";
import CheckersGame from "~/components/games/CheckersGame.vue";
import ChessGame from "~/components/games/ChessGame.vue";
import RamiGame from "~/components/games/RamiGame.vue";
import PokerGame from "~/components/games/PokerGame.vue";
import NonogramGame from "~/components/games/NonogramGame.vue";
import HiddenWordGame from "~/components/games/HiddenWordGame.vue";
import SudokuGame from "~/components/games/SudokuGame.vue";
import Game2048 from "~/components/games/Game2048.vue";
import UnoGame from "~/components/games/UnoGame.vue";
import GameMatchAside from "~/components/games/GameMatchAside.vue";
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";
import type {
  BeloteMode,
  GameCategory,
  GameEntry,
  PlayMode,
} from "~/types/game";
import type { GameAsidePanelState } from "~/components/games/types";

const { t } = useI18n();
const { isAuthenticated, login } = useAuth();
const authSession = useAuthSessionStore();

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
        descriptionKey:
          "gamePage.catalog.subCategories.classicCards.description",
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
          {
            id: "uno",
            nameKey: "gamePage.catalog.games.uno.name",
            descriptionKey: "gamePage.catalog.games.uno.description",
            icon: "mdi-cards-playing",
            component: "uno",
            supportedModes: ["ai", "pvp"],
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
        descriptionKey:
          "gamePage.catalog.subCategories.tableClassic.description",
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
        descriptionKey:
          "gamePage.catalog.subCategories.wordsLanguage.description",
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
        descriptionKey:
          "gamePage.catalog.subCategories.gridsPuzzles.description",
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
const isLoginDialogOpen = ref(false);
const isCoinsDialogOpen = ref(false);
const isPaymentSoonSnackbarOpen = ref(false);
const paymentSoonSnackbarText = ref("");
const userCoins = ref(0);
const usernameOrEmail = ref("");
const password = ref("");
const loginLoading = ref(false);
const loginError = ref("");
const liveGamePanel = ref<GameAsidePanelState | null>(null);
const coinOffers = [
  { id: "offer-1", coins: 1000, priceEuro: 1 },
  { id: "offer-2", coins: 5000, priceEuro: 4 },
  { id: "offer-3", coins: 100000, priceLabel: "À définir (ex: 49 €)" },
] as const;
const ramiGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
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
const canLaunchSelectedGame = computed(() => {
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
});

const modeLabel = (mode: PlayMode) =>
  mode === "ai" ? t("gamePage.modes.vsComputer") : t("gamePage.modes.vsPlayer");

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

const onGamePanelState = (payload: GameAsidePanelState) => {
  liveGamePanel.value = payload;
};

const onAsideAction = (actionId: string) => {
  if (selectedGame.value?.component !== "rami") return;
  ramiGameRef.value?.handleAsideAction(actionId);
};

watch([selectedGameId, isGameStarted], () => {
  if (!isGameStarted.value) {
    liveGamePanel.value = null;
  }
});

const gamePanelState = computed(() => ({
  gameStatusLabel: gameStatusLabel.value,
  canLaunchSelectedGame: canLaunchSelectedGame.value,
  selectedBeloteMode: selectedBeloteMode.value,
  modeLabel,
  getLevelColor,
  resetToCategories,
}));

const sidebarUserDisplayName = computed(() => {
  const firstName = authSession.profile?.firstName?.trim() ?? "";
  const lastName = authSession.profile?.lastName?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || authSession.profile?.username || "Player";
});

const formatCoinsAmount = (coins: number) => new Intl.NumberFormat("fr-FR").format(coins);

const formatOfferPrice = (offer: (typeof coinOffers)[number]) =>
  typeof offer.priceEuro === "number" ? `${offer.priceEuro} €` : offer.priceLabel;

const chooseCoinOffer = (offerId: string) => {
  isCoinsDialogOpen.value = false;
  paymentSoonSnackbarText.value = `Fonction de paiement bientôt disponible (${offerId})`;
  isPaymentSoonSnackbarOpen.value = true;

  // TODO(payment): brancher ici l'appel API réel (create checkout session / payment intent)
  // et gérer la mise à jour des coins utilisateur depuis la réponse backend.
};

const handleLogin = async () => {
  if (!usernameOrEmail.value.trim() || !password.value.trim()) {
    loginError.value = "Veuillez renseigner vos identifiants.";
    return;
  }

  loginLoading.value = true;
  loginError.value = "";

  try {
    await login(usernameOrEmail.value.trim(), password.value);
    isLoginDialogOpen.value = false;
    usernameOrEmail.value = "";
    password.value = "";
  } catch {
    loginError.value = "Connexion impossible. Réessayez.";
  } finally {
    loginLoading.value = false;
  }
};
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <div class="mb-4">
        <v-chip variant="outlined" prepend-icon="mdi-controller" class="mb-2">{{
          t("gamePage.sidebar.badge")
        }}</v-chip>
      </div>
      <div class="mb-4">
        <v-btn
          v-if="!isAuthenticated"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-login"
          @click="isLoginDialogOpen = true"
        >
          Connect
        </v-btn>
        <div v-else class="d-flex align-center ga-2">
          <UiAvatar
            :src="authSession.profile?.photo"
            :name="sidebarUserDisplayName"
            size="sm"
          />
          <div class="d-flex flex-column ga-1">
            <p class="text-body-2 font-weight-medium mb-0">
              {{ sidebarUserDisplayName }}
            </p>
            <p class="text-caption mb-0">{{ userCoins }} coins</p>
            <v-btn
              size="x-small"
              variant="outlined"
              prepend-icon="mdi-cash-plus"
              @click="isCoinsDialogOpen = true"
            >
              Acheter des coins
            </v-btn>
          </div>
        </div>
      </div>
      <div class="d-flex flex-column ga-2 mb-4">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-home"
          @click="resetToCategories"
          >{{ t("gamePage.navigation.backToCategories") }}</v-btn
        >
        <v-btn
          v-if="selectedGame"
          variant="tonal"
          prepend-icon="mdi-arrow-left"
          @click="selectedGameId = null"
        >
          {{ t("gamePage.navigation.backToGames") }}
        </v-btn>
        <v-btn
          v-if="selectedSubCategory"
          variant="tonal"
          prepend-icon="mdi-arrow-left"
          @click="selectedSubCategoryId = null"
        >
          {{ t("gamePage.navigation.backToSubCategories") }}
        </v-btn>
      </div>
      <div class="d-flex align-center flex-wrap ga-2 mb-0">
        <v-chip v-if="selectedPlayMode">{{
          selectedPlayMode ? modeLabel(selectedPlayMode) : "—"
        }}</v-chip>
        <v-chip v-if="gameStatusLabel">{{ gameStatusLabel }}</v-chip>
        <v-chip
          v-if="selectedCategory"
          prepend-icon="mdi-folder-open-outline"
          :color="getLevelColor('category')"
          >{{ t(selectedCategory.nameKey) }}</v-chip
        >
        <v-chip
          v-if="selectedSubCategory"
          prepend-icon="mdi-shape-outline"
          :color="getLevelColor('subCategory')"
          >{{ t(selectedSubCategory.nameKey) }}</v-chip
        >
        <v-chip
          v-if="selectedGame"
          prepend-icon="mdi-play-circle-outline"
          :color="getLevelColor('game')"
          >{{ t(selectedGame.nameKey) }}</v-chip
        >
      </div>

      <v-dialog v-model="isLoginDialogOpen" max-width="520">
        <v-card>
          <v-card-title>Connexion</v-card-title>
          <v-card-text class="d-flex flex-column ga-3">
            <v-text-field
              v-model="usernameOrEmail"
              label="Email ou username"
              variant="outlined"
              density="comfortable"
            />
            <v-text-field
              v-model="password"
              label="Mot de passe"
              type="password"
              variant="outlined"
              density="comfortable"
            />
            <v-alert
              v-if="loginError"
              type="error"
              variant="tonal"
              density="compact"
            >
              {{ loginError }}
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              :loading="loginLoading"
              @click="handleLogin"
            >
              Se connecter
            </v-btn>
            <v-btn variant="text" to="/login">Aller vers /login</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="isCoinsDialogOpen" max-width="760">
        <v-card>
          <v-card-title>Acheter des coins</v-card-title>
          <v-card-text class="pt-2">
            <v-row>
              <v-col
                v-for="offer in coinOffers"
                :key="offer.id"
                cols="12"
                md="4"
              >
                <v-card variant="outlined" class="h-100 d-flex flex-column">
                  <v-card-title class="text-h6">
                    {{ formatCoinsAmount(offer.coins) }} coins
                  </v-card-title>
                  <v-card-subtitle class="text-body-1">
                    {{ formatOfferPrice(offer) }}
                  </v-card-subtitle>
                  <v-card-actions class="mt-auto">
                    <v-btn
                      color="primary"
                      variant="flat"
                      block
                      @click="chooseCoinOffer(offer.id)"
                    >
                      Choisir
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" variant="text" @click="isCoinsDialogOpen = false"
              >Fermer</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-snackbar
        v-model="isPaymentSoonSnackbarOpen"
        timeout="2400"
        color="info"
        location="bottom right"
      >
        {{ paymentSoonSnackbarText }}
      </v-snackbar>
    </template>
    <template #aside>
      <GameMatchAside
        :selected-category="selectedCategory"
        :selected-sub-category="selectedSubCategory"
        :selected-game="selectedGame"
        :selected-play-mode="selectedPlayMode"
        :is-game-started="isGameStarted"
        :game-panel-state="gamePanelState"
        :live-game-panel="liveGamePanel"
        @action="onAsideAction"
      />
    </template>
    <template #default>
      <section v-if="!selectedCategory" class="mb-4">
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="category in categories"
            :key="category.id"
            cols="12"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex align-start ga-3">
                <v-avatar :color="getLevelColor('category')" variant="tonal"
                  ><v-icon :icon="category.icon"
                /></v-avatar>
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
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex align-start ga-3">
                <v-avatar :color="getLevelColor('subCategory')" variant="tonal"
                  ><v-icon :icon="subCategory.icon"
                /></v-avatar>
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
            md="6"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex flex-column ga-2 h-100">
                <div class="d-flex justify-content-center align-center">
                  <v-avatar :color="getLevelColor('game')" variant="tonal"
                  ><v-icon :icon="game.icon"
                  /></v-avatar>
                  <h3 class="card-title mx-4">{{ t(game.nameKey) }}</h3>
                </div>
                <p class="card-description">{{ t(game.descriptionKey) }}</p>
                <v-btn
                  :color="getLevelColor('game')"
                  variant="flat"
                  :disabled="!game.component || !game.supportedModes.length"
                  @click="openGame(game.id)"
                >
                  {{
                    game.component
                      ? t("gamePage.actions.chooseGame")
                      : t("gamePage.status.comingSoon")
                  }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else-if="selectedGame && !isGameStarted" class="mb-1 setup-section">
        <v-card class="pa-4 unified-card" variant="outlined">
          <div v-if="selectedGame.features?.length" class="mb-4">
            <h3 class="section-title mb-2">
              {{ t("gamePage.labels.features") }}
            </h3>
            <ul class="info-list">
              <li
                v-for="feature in selectedGame.features"
                :key="`selected-feature-${feature}`"
              >
                {{ t(feature) }}
              </li>
            </ul>
          </div>

          <v-row class="mb-4" dense>
            <v-col cols="6">
              <v-card
                class="mode-card h-100"
                :class="{ 'mode-card--active': selectedPlayMode === 'ai' }"
                :variant="selectedPlayMode === 'ai' ? 'flat' : 'outlined'"
                :color="selectedPlayMode === 'ai' ? getLevelColor('mode') : undefined"
                :disabled="!selectedGame.supportedModes.includes('ai')"
                @click="selectedGame.supportedModes.includes('ai') && selectPlayMode('ai')"
              >
                <v-card-text class="text-center py-8 font-weight-bold text-subtitle-1">
                  {{ modeLabel("ai") }}
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card
                class="mode-card h-100"
                :class="{ 'mode-card--active': selectedPlayMode === 'pvp' }"
                :variant="selectedPlayMode === 'pvp' ? 'flat' : 'outlined'"
                :color="selectedPlayMode === 'pvp' ? getLevelColor('subCategory') : undefined"
                :disabled="!selectedGame.supportedModes.includes('pvp')"
                @click="selectedGame.supportedModes.includes('pvp') && selectPlayMode('pvp')"
              >
                <v-card-text class="text-center py-8 font-weight-bold text-subtitle-1">
                  {{ modeLabel("pvp") }}
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div
            v-if="selectedGame.id === 'belote'"
            class="d-flex flex-wrap ga-2 mb-4"
          >
            <v-btn
              color="deep-purple"
              :variant="selectedBeloteMode === 'teams' ? 'flat' : 'outlined'"
              @click="selectBeloteMode('teams')"
            >
              Belote 2v2
            </v-btn>
            <v-btn
              color="deep-purple"
              :variant="
                selectedBeloteMode === 'free-for-all' ? 'flat' : 'outlined'
              "
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
        </v-card>
        <div class="d-flex justify-center mt-auto pt-6">
          <v-btn
              :color="getLevelColor('game')"
              :disabled="!canLaunchSelectedGame"
              size="large"
              @click="launchGame"
          >
            {{ t("gamePage.actions.launchGame") }}
          </v-btn>
        </div>
      </section>

      <section v-else-if="selectedGame && selectedPlayMode && isGameStarted">
        <RamiGame
          ref="ramiGameRef"
          v-if="selectedGame.component === 'rami'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <BeloteGame
          v-else-if="selectedGame.component === 'belote'"
          :selected-play-mode="selectedPlayMode"
          :belote-mode="selectedBeloteMode ?? 'teams'"
          @panel-state="onGamePanelState"
        />
        <CheckersGame
          v-else-if="selectedGame.component === 'checkers'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <PokerGame
          v-else-if="selectedGame.component === 'poker'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <NonogramGame
          v-else-if="selectedGame.component === 'nonogram'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <HiddenWordGame
          v-else-if="selectedGame.component === 'hidden-word'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <ChessGame
          v-else-if="selectedGame.component === 'chess'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <SudokuGame
          v-else-if="selectedGame.component === 'sudoku'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <Game2048
          v-else-if="selectedGame.component === 'game2048'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <UnoGame
          v-else-if="selectedGame.component === 'uno'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
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

.setup-section {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
}

.mode-card {
  cursor: pointer;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 35%, transparent);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.18);
}

.mode-card--active {
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.18);
}

@media (max-width: 959px) {
  .unified-shell,
  .unified-card {
    border-radius: 14px;
  }
}
</style>
