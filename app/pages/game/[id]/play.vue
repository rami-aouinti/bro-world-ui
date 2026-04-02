<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";
import GameMatchAside from "~/components/games/GameMatchAside.vue";
import RamiGame from "~/components/games/RamiGame.vue";
import BeloteGame from "~/components/games/BeloteGame.vue";
import CheckersGame from "~/components/games/CheckersGame.vue";
import PokerGame from "~/components/games/PokerGame.vue";
import NonogramGame from "~/components/games/NonogramGame.vue";
import HiddenWordGame from "~/components/games/HiddenWordGame.vue";
import ChessGame from "~/components/games/ChessGame.vue";
import SudokuGame from "~/components/games/SudokuGame.vue";
import Game2048 from "~/components/games/Game2048.vue";
import UnoGame from "~/components/games/UnoGame.vue";
import type { GameAsidePanelState } from "~/components/games/types";
import { useGameCatalogStore } from "~/stores/gameCatalog";
import type { BeloteMode, GameEntry, PlayMode } from "~/types/game";
import {
  useGameSessionsApi,
  type SessionResult,
} from "~/composables/api/useGameSessionsApi";

definePageMeta({
  splitShell: false,
});

const route = useRoute();
const router = useRouter();
const gameCatalogStore = useGameCatalogStore();
const gameSessionsApi = useGameSessionsApi();
const authSession = useAuthSessionStore();
const { isAuthenticated } = useAuth();
const { categories } = storeToRefs(gameCatalogStore);
const { t, te } = useI18n();
const finishLoading = ref(false);
const liveGamePanel = ref<GameAsidePanelState | null>(null);

const gameComponents: Record<string, unknown> = {
  rami: RamiGame,
  belote: BeloteGame,
  checkers: CheckersGame,
  poker: PokerGame,
  nonogram: NonogramGame,
  "hidden-word": HiddenWordGame,
  chess: ChessGame,
  sudoku: SudokuGame,
  game2048: Game2048,
  uno: UnoGame,
};

const gameId = computed(() => {
  const raw = route.query.gameId;
  return typeof raw === "string" && raw ? raw : null;
});

const selectedPlayMode = computed<PlayMode>(() =>
  route.query.mode === "pvp" ? "pvp" : "ai",
);
const selectedBeloteMode = computed<BeloteMode>(() =>
  route.query.beloteMode === "free-for-all" ? "free-for-all" : "teams",
);
const selectedLevel = computed(() =>
  typeof route.query.level === "string" ? route.query.level : null,
);
const sessionId = computed(() =>
  typeof route.query.sessionId === "string" ? route.query.sessionId : null,
);

const selectedCategory = computed(() => {
  if (!gameId.value) return null;
  return (
    categories.value.find((category) =>
      category.subCategories.some((sub) =>
        sub.games.some((game) => game.id === gameId.value),
      ),
    ) ?? null
  );
});

const selectedSubCategory = computed(() => {
  if (!gameId.value) return null;
  return (
    selectedCategory.value?.subCategories.find((sub) =>
      sub.games.some((game) => game.id === gameId.value),
    ) ?? null
  );
});

const selectedGame = computed<GameEntry | null>(() => {
  if (!gameId.value) return null;
  return (
    selectedSubCategory.value?.games.find((game) => game.id === gameId.value) ?? null
  );
});

const selectedComponent = computed(() =>
  selectedGame.value?.component
    ? gameComponents[selectedGame.value.component]
    : null,
);

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

const formattedUserCoins = computed(() =>
  formatCoinsAmount(authSession.profile?.coins ?? 0),
);

const modeLabel = (mode: PlayMode) =>
  mode === "ai" ? t("gamePage.modes.vsComputer") : t("gamePage.modes.vsPlayer");

const gamePanelState = computed(() => ({
  gameStatusLabel: t("gamePage.status.inProgress"),
  canLaunchSelectedGame: false,
  selectedBeloteMode: selectedBeloteMode.value,
  modeLabel,
  getLevelColor: (_level: "category" | "subCategory" | "game" | "mode" | "info") =>
    "info",
  resetToCategories: () => router.push("/game"),
}));

const finishGame = async (result: SessionResult) => {
  if (!sessionId.value || finishLoading.value) return;

  finishLoading.value = true;
  try {
    const response = await gameSessionsApi.finishGameSession(sessionId.value, result);

    if (authSession.profile) {
      authSession.profile = {
        ...authSession.profile,
        coins: response.coins,
      };
    }

    await router.push("/game");
  } finally {
    finishLoading.value = false;
  }
};

const onGamePanelState = (payload: GameAsidePanelState) => {
  liveGamePanel.value = payload;
};

onMounted(async () => {
  await gameCatalogStore.fetchCatalog();
});
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <v-chip variant="outlined" prepend-icon="mdi-controller" class="mb-3">
        {{ t("gamePage.sidebar.badge") }}
      </v-chip>

      <div v-if="isAuthenticated" class="d-flex align-center ga-2 mb-4">
        <UiAvatar
          :src="authSession.profile?.photo"
          :name="sidebarUserDisplayName"
          size="40"
        />
        <div>
          <p class="text-body-2 font-weight-bold mb-0">{{ sidebarUserDisplayName }}</p>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ t("gamePage.auth.coinsBalance", { count: formattedUserCoins }) }}
          </p>
        </div>
      </div>

      <v-card variant="outlined" class="mb-3">
        <v-card-text class="d-flex flex-column ga-1">
          <p class="text-caption text-medium-emphasis mb-0">Catégorie</p>
          <p class="text-body-2 mb-0">{{ selectedCategory ? t(selectedCategory.nameKey) : "—" }}</p>
          <p class="text-caption text-medium-emphasis mb-0 mt-2">Sous-catégorie</p>
          <p class="text-body-2 mb-0">
            {{ selectedSubCategory ? t(selectedSubCategory.nameKey) : "—" }}
          </p>
          <p class="text-caption text-medium-emphasis mb-0 mt-2">Jeu</p>
          <p class="text-body-2 mb-0">{{ selectedGame ? t(selectedGame.nameKey) : "—" }}</p>
        </v-card-text>
      </v-card>

      <v-btn block variant="outlined" prepend-icon="mdi-arrow-left" @click="router.push('/game')">
        {{ t("gamePage.navigation.backToCategories") }}
      </v-btn>
    </template>

    <template #aside>
      <GameMatchAside
        :selected-category="selectedCategory"
        :selected-sub-category="selectedSubCategory"
        :selected-game="selectedGame"
        :selected-play-mode="selectedPlayMode"
        :is-game-started="true"
        :game-panel-state="gamePanelState"
        :live-game-panel="liveGamePanel"
      />

      <v-card variant="outlined" class="mt-4">
        <v-card-text class="d-flex flex-column ga-2">
          <p class="text-caption text-medium-emphasis mb-0">
            Session: {{ sessionId ?? "—" }}
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            User game: {{ route.params.id }}
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            Level: {{ selectedLevel ?? "—" }}
          </p>

          <div class="d-flex ga-2 mt-2">
            <v-btn
              color="success"
              size="small"
              :loading="finishLoading"
              :disabled="!sessionId"
              @click="finishGame('win')"
            >
              Finish win
            </v-btn>
            <v-btn
              color="error"
              size="small"
              :loading="finishLoading"
              :disabled="!sessionId"
              @click="finishGame('lose')"
            >
              Finish lose
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </template>

    <component
      :is="selectedComponent"
      v-if="selectedComponent"
      :selected-play-mode="selectedPlayMode"
      :belote-mode="selectedBeloteMode"
      @panel-state="onGamePanelState"
    />

    <v-alert v-else type="warning" variant="tonal">
      {{ te("gamePage.status.none") ? t("gamePage.status.none") : "Game not found." }}
    </v-alert>
  </PlatformSplitLayout>
</template>
