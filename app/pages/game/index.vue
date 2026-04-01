<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
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
  ApiPlayMode,
  BeloteMode,
  GameCategory,
  GameEntry,
  PlayMode,
} from "~/types/game";
import { mapApiPlayModeToUiMode } from "~/utils/gameCatalogMapper";
import type { GameAsidePanelState } from "~/components/games/types";
import { useGameCatalogStore } from "~/stores/gameCatalog";

const { t } = useI18n();
const { isAuthenticated, login } = useAuth();
const authSession = useAuthSessionStore();

const cardMotion = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 450,
    },
  },
  hovered: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 180,
    },
  },
};

const imageMotion = {
  initial: {
    opacity: 0,
    scale: 0.92,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 500,
    },
  },
  hovered: {
    scale: 1.04,
    transition: {
      duration: 200,
    },
  },
};

definePageMeta({
  splitShell: false,
});

const gameCatalogStore = useGameCatalogStore();
const {
  categories: storeCategories,
  isLoading: isCatalogLoading,
  error: catalogError,
} = storeToRefs(gameCatalogStore);
const categories = computed<GameCategory[]>(() => storeCategories.value);


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
  {
    id: "offer-1",
    coins: 1000,
    priceEuro: 1,
    labelKey: "gamePage.auth.offers.offer1Label",
  },
  {
    id: "offer-2",
    coins: 5000,
    priceEuro: 4,
    labelKey: "gamePage.auth.offers.offer2Label",
  },
  {
    id: "offer-3",
    coins: 100000,
    priceLabelKey: "gamePage.auth.offers.offer3PriceLabel",
    labelKey: "gamePage.auth.offers.offer3Label",
  },
] as const;
const ramiGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const beloteGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const checkersGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const chessGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const sudokuGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const nonogramGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const hiddenWordGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const game2048Ref = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const pokerGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
const unoGameRef = ref<{
  handleAsideAction: (actionId: string) => void;
} | null>(null);
type AsideActionHandler = {
  handleAsideAction: (actionId: string) => void;
};
const allGameEntries = computed(() =>
  categories.value.flatMap((category) =>
    category.subCategories.flatMap((subCategory) => subCategory.games),
  ),
);

const selectedCategory = computed(
  () =>
    categories.value.find((category) => category.id === selectedCategoryId.value) ??
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
const localSupportedModes = computed<PlayMode[]>(() =>
  Array.from(
    new Set(
      (selectedGame.value?.supportedModes ?? [])
        .map((mode) => mapApiPlayModeToUiMode(mode as ApiPlayMode))
        .filter((mode): mode is PlayMode => Boolean(mode)),
    ),
  ),
);

const canLaunchSelectedGame = computed(() => {
  if (!selectedGame.value?.component) return false;

  const hasPlayableMode =
    Boolean(selectedPlayMode.value) &&
    localSupportedModes.value.includes(selectedPlayMode.value as PlayMode);

  if (!hasPlayableMode) return false;

  if (selectedGame.value.id === "belote") {
    return Boolean(selectedBeloteMode.value);
  }

  return true;
});

const modeLabel = (mode: PlayMode | ApiPlayMode) => {
  if (mode === "ai" || mode === "solo") return t("gamePage.modes.vsComputer");
  if (mode === "pvp" || mode === "versus") return t("gamePage.modes.vsPlayer");
  if (mode === "online") return t("gamePage.status.soonHint");
  return t("gamePage.status.soonHint");
};

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

const colorPalettesByTone: Record<
  "category" | "subCategory" | "game",
  [string, string, string]
> = {
  category: ["#5b8cff", "#40c4ff", "#7c4dff"],
  subCategory: ["#26a69a", "#42a5f5", "#7e57c2"],
  game: ["#ff7043", "#ffca28", "#ab47bc"],
};

const getCatalogImageStyle = (
  seed: string,
  tone: "category" | "subCategory" | "game",
) => {
  const palette = colorPalettesByTone[tone];
  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = 110 + (hash % 120);
  const first = palette[hash % palette.length];
  const second = palette[(hash + 1) % palette.length];
  const third = palette[(hash + 2) % palette.length];

  return {
    background: `
      radial-gradient(circle at 18% 20%, ${first}55 0%, transparent 45%),
      radial-gradient(circle at 85% 15%, ${second}4d 0%, transparent 40%),
      linear-gradient(${angle}deg, ${third}40 0%, rgba(15, 23, 42, 0.12) 70%)
    `,
  };
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
  if (!localSupportedModes.value.includes(mode)) {
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
  const component = selectedGame.value?.component;
  if (!component) return;

  const asideHandlersByComponent: Record<
    NonNullable<GameEntry["component"]>,
    AsideActionHandler | null
  > = {
    rami: ramiGameRef.value,
    belote: beloteGameRef.value,
    checkers: checkersGameRef.value,
    chess: chessGameRef.value,
    sudoku: sudokuGameRef.value,
    nonogram: nonogramGameRef.value,
    "hidden-word": hiddenWordGameRef.value,
    game2048: game2048Ref.value,
    poker: pokerGameRef.value,
    uno: unoGameRef.value,
  };

  asideHandlersByComponent[component]?.handleAsideAction(actionId);
};

const globalRestartAction = computed(() => {
  const actions = liveGamePanel.value?.actions ?? [];
  const primaryIds = new Set([
    "play-again",
    "new-round",
    "new-deal",
    "restart",
    "new-grid",
    "new-game",
    "next",
    "reset",
    "next-hand",
  ]);

  return actions.find((action) => primaryIds.has(action.id)) ?? null;
});

onMounted(async () => {
  await gameCatalogStore.fetchCatalog();
});

watch(categories, (nextCategories) => {
  if (!nextCategories.length) {
    resetToCategories();
    return;
  }

  const hasSelectedCategory = nextCategories.some(
    (category) => category.id === selectedCategoryId.value,
  );

  if (!hasSelectedCategory) {
    resetToCategories();
    return;
  }

  const nextSelectedCategory = nextCategories.find(
    (category) => category.id === selectedCategoryId.value,
  );

  if (!nextSelectedCategory) {
    resetToCategories();
    return;
  }

  const hasSelectedSubCategory = nextSelectedCategory.subCategories.some(
    (subCategory) => subCategory.id === selectedSubCategoryId.value,
  );

  if (!hasSelectedSubCategory) {
    selectedSubCategoryId.value = null;
    selectedGameId.value = null;
    selectedPlayMode.value = null;
    selectedBeloteMode.value = null;
    isGameStarted.value = false;
    return;
  }

  const nextSelectedSubCategory = nextSelectedCategory.subCategories.find(
    (subCategory) => subCategory.id === selectedSubCategoryId.value,
  );

  if (!nextSelectedSubCategory) {
    selectedGameId.value = null;
    selectedPlayMode.value = null;
    selectedBeloteMode.value = null;
    isGameStarted.value = false;
    return;
  }

  const hasSelectedGame = nextSelectedSubCategory.games.some(
    (game) => game.id === selectedGameId.value,
  );

  if (!hasSelectedGame) {
    selectedGameId.value = null;
    selectedPlayMode.value = null;
    selectedBeloteMode.value = null;
    isGameStarted.value = false;
  }
}, { immediate: true });

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

  return (
    fullName ||
    authSession.profile?.username ||
    t("gamePage.auth.defaultPlayerName")
  );
});

const formatCoinsAmount = (coins: number) =>
  new Intl.NumberFormat("fr-FR").format(coins);

const formatOfferPrice = (offer: (typeof coinOffers)[number]) =>
  typeof offer.priceEuro === "number"
    ? `${offer.priceEuro} €`
    : t(offer.priceLabelKey ?? "gamePage.auth.offers.offer3PriceLabel");

const chooseCoinOffer = (offerId: string) => {
  isCoinsDialogOpen.value = false;
  paymentSoonSnackbarText.value = t("gamePage.auth.paymentSoon", { offerId });
  isPaymentSoonSnackbarOpen.value = true;

  // TODO(payment): brancher ici l'appel API réel (create checkout session / payment intent)
  // et gérer la mise à jour des coins utilisateur depuis la réponse backend.
};

const handleLogin = async () => {
  if (!usernameOrEmail.value.trim() || !password.value.trim()) {
    loginError.value = t("gamePage.auth.loginMissingCredentials");
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
    loginError.value = t("gamePage.auth.loginFailed");
  } finally {
    loginLoading.value = false;
  }
};
</script>

<template>
  <teleport
    v-if="isGameStarted && globalRestartAction"
    to="#app-bar-teleport-target-right"
  >
    <v-btn
      color="primary"
      variant="tonal"
      prepend-icon="mdi-refresh"
      :disabled="globalRestartAction.disabled"
      @click="onAsideAction(globalRestartAction.id)"
    >
      {{ globalRestartAction.label }}
    </v-btn>
  </teleport>
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
          {{ t("gamePage.auth.connect") }}
        </v-btn>
        <div v-else class="d-flex align-center ga-1">
          <UiAvatar
            :src="authSession.profile?.photo"
            :name="sidebarUserDisplayName"
            size="lg"
          />
          <div class="d-flex flex-column mx-3">
            <p class="text-body-2 font-weight-medium">
              {{ sidebarUserDisplayName }} -
              {{ t("gamePage.auth.coinsBalance", { count: userCoins }) }}
            </p>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-cash-plus"
              @click="isCoinsDialogOpen = true"
            >
              {{ t("gamePage.auth.buyCoins") }}
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
          v-if="selectedSubCategory"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          @click="selectedSubCategoryId = null"
        >
          {{ t("gamePage.navigation.backToSubCategories") }}
        </v-btn>
        <v-btn
          v-if="selectedGame"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          @click="selectedGameId = null"
        >
          {{ t("gamePage.navigation.backToGames") }}
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
          <v-card-title>{{ t("gamePage.auth.loginModalTitle") }}</v-card-title>
          <v-card-text class="d-flex flex-column ga-3">
            <v-text-field
              v-model="usernameOrEmail"
              :label="t('gamePage.auth.loginEmailOrUsername')"
              variant="outlined"
              density="comfortable"
            />
            <v-text-field
              v-model="password"
              :label="t('gamePage.auth.loginPassword')"
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
            <v-btn color="primary" :loading="loginLoading" @click="handleLogin">
              {{ t("gamePage.auth.loginSubmit") }}
            </v-btn>
            <v-btn variant="text" to="/login">{{
              t("gamePage.auth.goToLoginPage")
            }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="isCoinsDialogOpen" max-width="760">
        <v-card>
          <v-card-title>{{
            t("gamePage.auth.buyCoinsModalTitle")
          }}</v-card-title>
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
                    {{
                      t(offer.labelKey, {
                        count: formatCoinsAmount(offer.coins),
                      })
                    }}
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
                      {{ t("gamePage.auth.chooseOffer") }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              variant="text"
              @click="isCoinsDialogOpen = false"
              >{{ t("gamePage.auth.closeModal") }}</v-btn
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
      <section v-if="isCatalogLoading">
        <v-row>
          <v-col v-for="index in 4" :key="`catalog-skeleton-${index}`" cols="12" md="6">
            <v-skeleton-loader type="heading, image" class="h-100" />
          </v-col>
        </v-row>
      </section>

      <section v-else-if="catalogError">
        <v-alert type="error" variant="tonal" class="mb-4">
          {{ catalogError }}
        </v-alert>
        <v-btn color="primary" variant="outlined" @click="gameCatalogStore.fetchCatalog(true)">
          {{ t("common.retry") }}
        </v-btn>
      </section>

      <section v-else-if="!categories.length">
        <v-alert type="info" variant="tonal">
          {{ t("gamePage.status.none") }}
        </v-alert>
      </section>

      <section v-else-if="!selectedCategory">
        <v-row>
          <v-col v-for="category in categories" :key="category.id" cols="12" md="6">
            <v-card
                v-motion
                :initial="cardMotion.initial"
                :enter="cardMotion.enter"
                :hovered="cardMotion.hovered"
                class="h-100 card-category-game"
                variant="text"
            >
              <v-card-title class="text-center">{{ t(category?.nameKey) }}</v-card-title>
              <div class="w-100">
                <div
                    v-motion
                    :initial="imageMotion.initial"
                    :enter="imageMotion.enter"
                    :hovered="imageMotion.hovered"
                    class="catalog-image"
                    @click="openCategory(category.id)"
                    :style="getCatalogImageStyle(category.id, 'category')"
                >
                  <v-img :src="category.img" alt="Card" />
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
            md="6"
          >
            <v-card
                v-motion
                :initial="cardMotion.initial"
                :enter="cardMotion.enter"
                :hovered="cardMotion.hovered"
                class="h-100 card-category-game"
                variant="text"
            >
              <v-card-title class="text-center">{{ t(subCategory?.nameKey) }}</v-card-title>
              <div class="w-100">
                <div
                    @click="openSubCategory(subCategory.id)"
                    v-motion
                    :initial="imageMotion.initial"
                    :enter="imageMotion.enter"
                    :hovered="imageMotion.hovered"
                    class="catalog-image"
                    :style="getCatalogImageStyle(subCategory.id, 'subCategory')"
                >
                  <v-img :src="subCategory.img" alt="Card" />
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
                v-motion
                :initial="cardMotion.initial"
                :enter="cardMotion.enter"
                :hovered="cardMotion.hovered"
                class="h-100 card-category-game"
                variant="text"
            >
              <v-card-title class="text-center">{{ t(game?.nameKey) }}</v-card-title>
              <div class="w-100">
                <div
                    @click="openGame(game.id)"
                    :disabled="!game.component || !game.supportedModes.length"
                    v-motion
                    :initial="imageMotion.initial"
                    :enter="imageMotion.enter"
                    :hovered="imageMotion.hovered"
                    class="catalog-image"
                    :style="getCatalogImageStyle(game.id, 'game')"
                >
                  <v-img :src="game.img" alt="Card" />
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section
        v-else-if="selectedGame && !isGameStarted"
        class="mb-1 setup-section"
      >
        <v-row class="mb-4" dense>
          <v-col cols="6">
            <v-card
                v-motion
                :initial="cardMotion.initial"
                :enter="cardMotion.enter"
                :hovered="cardMotion.hovered"
                class="mode-card h-100 d-flex align-center justify-center"
                :class="{ 'mode-card--active': selectedPlayMode === 'ai' }"
                :variant="selectedPlayMode === 'ai' ? 'flat' : 'outlined'"
                :color="
                  selectedPlayMode === 'ai' ? getLevelColor('mode') : undefined
                "
                :disabled="!localSupportedModes.includes('ai')"
                @click="
                  localSupportedModes.includes('ai') &&
                  selectPlayMode('ai')
                "
            >
              <v-card-text
                  class="text-center font-weight-bold text-title-large"
              >
                {{ modeLabel("ai") }}
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card
                v-motion
                :initial="cardMotion.initial"
                :enter="cardMotion.enter"
                :hovered="cardMotion.hovered"
                class="mode-card h-100 d-flex align-center justify-center"
                :class="{ 'mode-card--active': selectedPlayMode === 'pvp' }"
                :variant="selectedPlayMode === 'pvp' ? 'flat' : 'outlined'"
                :color="
                  selectedPlayMode === 'pvp'
                    ? getLevelColor('subCategory')
                    : undefined
                "
                :disabled="!localSupportedModes.includes('pvp')"
                @click="
                  localSupportedModes.includes('pvp') &&
                  selectPlayMode('pvp')
                "
            >
              <v-card-text
                  class="text-center font-weight-bold text-title-large"
              >
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
            {{ t("gamePage.labels.beloteTeams") }}
          </v-btn>
          <v-btn
              color="deep-purple"
              :variant="
                selectedBeloteMode === 'free-for-all' ? 'flat' : 'outlined'
              "
              @click="selectBeloteMode('free-for-all')"
          >
            {{ t("gamePage.labels.beloteFreeForAll") }}
          </v-btn>
        </div>

        <v-alert
            v-if="
              !localSupportedModes.length || !selectedGame.component
            "
            type="info"
            variant="tonal"
            class="mb-4"
        >
          {{ t("gamePage.status.soonHint") }}
        </v-alert>
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
          ref="beloteGameRef"
          v-else-if="selectedGame.component === 'belote'"
          :selected-play-mode="selectedPlayMode"
          :belote-mode="selectedBeloteMode ?? 'teams'"
          @panel-state="onGamePanelState"
        />
        <CheckersGame
          ref="checkersGameRef"
          v-else-if="selectedGame.component === 'checkers'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <PokerGame
          ref="pokerGameRef"
          v-else-if="selectedGame.component === 'poker'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <NonogramGame
          ref="nonogramGameRef"
          v-else-if="selectedGame.component === 'nonogram'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <HiddenWordGame
          ref="hiddenWordGameRef"
          v-else-if="selectedGame.component === 'hidden-word'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <ChessGame
          ref="chessGameRef"
          v-else-if="selectedGame.component === 'chess'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <SudokuGame
          ref="sudokuGameRef"
          v-else-if="selectedGame.component === 'sudoku'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <Game2048
          ref="game2048Ref"
          v-else-if="selectedGame.component === 'game2048'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
        <UnoGame
          ref="unoGameRef"
          v-else-if="selectedGame.component === 'uno'"
          :selected-play-mode="selectedPlayMode"
          @panel-state="onGamePanelState"
        />
      </section>
    </template>
  </PlatformSplitLayout>
</template>

<style scoped>
.card-category-game {
  padding: 20px;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-category-game:hover {
  transform: translateY(-10px) scale(1.03);
}
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


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

.catalog-image {
  cursor: pointer;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid
    color-mix(in srgb, rgb(var(--v-theme-primary)) 24%, transparent);
}

.catalog-image::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(155deg, rgba(255, 255, 255, 0.16) 0%, transparent 54%),
    linear-gradient(0deg, rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.12));
}

.catalog-image__overlay {
  position: relative;
  z-index: 1;
  min-height: 118px;
  padding: 0.75rem 0.95rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.95);
}

.catalog-image__label {
  font-size: 0.88rem;
  line-height: 1.35;
  text-shadow: 0 2px 10px rgba(15, 23, 42, 0.25);
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
  border: 1px solid
    color-mix(in srgb, rgb(var(--v-theme-primary)) 35%, transparent);
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
