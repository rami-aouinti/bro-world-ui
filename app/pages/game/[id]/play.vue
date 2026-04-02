<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
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
const { categories } = storeToRefs(gameCatalogStore);
const finishLoading = ref(false);

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

const selectedGame = computed<GameEntry | null>(() => {
  if (!gameId.value) return null;

  for (const category of categories.value) {
    for (const sub of category.subCategories) {
      const found = sub.games.find((game) => game.id === gameId.value);
      if (found) return found;
    }
  }

  return null;
});

const selectedComponent = computed(() =>
  selectedGame.value?.component
    ? gameComponents[selectedGame.value.component]
    : null,
);

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

onMounted(async () => {
  await gameCatalogStore.fetchCatalog();
});
</script>

<template>
  <div class="play-page">
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <div>
        <h1 class="text-h5 mb-1">Partie en cours</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          User game: {{ route.params.id }} · Level: {{ selectedLevel ?? "—" }}
        </p>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="outlined" @click="router.push('/game')">Quitter</v-btn>
        <v-btn
          color="success"
          :loading="finishLoading"
          :disabled="!sessionId"
          @click="finishGame('win')"
        >
          Terminer (win)
        </v-btn>
        <v-btn
          color="error"
          :loading="finishLoading"
          :disabled="!sessionId"
          @click="finishGame('lose')"
        >
          Terminer (lose)
        </v-btn>
      </div>
    </div>

    <component
      :is="selectedComponent"
      v-if="selectedComponent"
      :selected-play-mode="selectedPlayMode"
      :belote-mode="selectedBeloteMode"
    />

    <v-alert v-else type="warning" variant="tonal">
      Impossible de charger ce jeu pour la session actuelle.
    </v-alert>
  </div>
</template>
