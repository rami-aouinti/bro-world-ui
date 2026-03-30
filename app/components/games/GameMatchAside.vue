<script setup lang="ts">
import type { PropType } from "vue";
import type {
  BeloteMode,
  GameCategory,
  GameEntry,
  GameSubCategory,
  PlayMode,
} from "~/types/game";
import type { GamePanelStatePayload } from "~/types/gamePanel";

type PanelLevel = "category" | "subCategory" | "game" | "mode" | "info";

interface GamePanelState {
  gameStatusLabel: string;
  canLaunchSelectedGame: boolean;
  selectedBeloteMode: BeloteMode | null;
  modeLabel: (mode: PlayMode) => string;
  getLevelColor: (level: PanelLevel) => string;
  resetToCategories: () => void;
}

defineProps({
  selectedCategory: {
    type: Object as PropType<GameCategory | null>,
    default: null,
  },
  selectedSubCategory: {
    type: Object as PropType<GameSubCategory | null>,
    default: null,
  },
  selectedGame: {
    type: Object as PropType<GameEntry | null>,
    default: null,
  },
  selectedPlayMode: {
    type: String as PropType<PlayMode | null>,
    default: null,
  },
  isGameStarted: {
    type: Boolean,
    required: true,
  },
  gamePanelState: {
    type: Object as PropType<GamePanelState>,
    required: true,
  },
  liveGamePanel: {
    type: Object as PropType<GamePanelStatePayload | null>,
    default: null,
  },
});

const { t } = useI18n();

const liveHintByGameId: Record<string, string> = {
  belote: "Belote · suivi des plis, score d'équipe, contrat actif",
  rami: "Rami · score des manches, cartes posées, état de la pioche",
  poker: "Poker · pot courant, phase de jeu, joueur actif",
  checkers: "Dames · tour en cours, pièces restantes, captures possibles",
  chess: "Échecs · joueur au trait, état d'échec, historique des coups",
  sudoku: "Sudoku · erreurs, timer, progression de la grille",
  "game-2048": "2048 · score live, meilleure tuile, prochain objectif",
  "hidden-word": "Mot caché · essais restants, indice actif, série en cours",
  nonogram: "Nonogramme · progression ligne/colonne, erreurs, timer",
};
</script>

<template>
  <v-chip variant="outlined" class="mb-4 title-chip" prepend-icon="mdi-information-outline">
    {{ t("gamePage.info.title") }}
  </v-chip>

  <v-card class="pa-4 unified-card mb-4" variant="outlined">
    <p class="text-caption text-medium-emphasis mb-2">{{ t("gamePage.info.status") }}</p>
    <v-chip :color="isGameStarted ? 'warning' : gamePanelState.getLevelColor('info')" variant="tonal">
      {{ gamePanelState.gameStatusLabel }}
    </v-chip>
  </v-card>

  <v-card class="pa-4 unified-card mb-4" variant="outlined">
    <p class="text-caption text-medium-emphasis mb-2">{{ t("gamePage.info.category") }}</p>
    <v-chip
      v-if="selectedCategory"
      prepend-icon="mdi-folder-open-outline"
      :color="gamePanelState.getLevelColor('category')"
      variant="tonal"
    >
      {{ t(selectedCategory.nameKey) }}
    </v-chip>
    <p v-else class="section-subtitle mb-0">{{ t("gamePage.sidebar.description") }}</p>
  </v-card>

  <v-card class="pa-4 unified-card mb-4" variant="outlined">
    <p class="text-caption text-medium-emphasis mb-2">{{ t("gamePage.info.subCategory") }}</p>
    <v-chip
      v-if="selectedSubCategory"
      prepend-icon="mdi-shape-outline"
      :color="gamePanelState.getLevelColor('subCategory')"
      variant="tonal"
    >
      {{ t(selectedSubCategory.nameKey) }}
    </v-chip>
    <p v-else class="section-subtitle mb-0">—</p>

    <p class="text-caption text-medium-emphasis mt-4 mb-2">{{ t("gamePage.info.game") }}</p>
    <v-chip
      v-if="selectedGame"
      prepend-icon="mdi-play-circle-outline"
      :color="gamePanelState.getLevelColor('game')"
      variant="tonal"
    >
      {{ t(selectedGame.nameKey) }}
    </v-chip>
    <p v-else class="section-subtitle mb-0">—</p>
  </v-card>

  <v-card class="pa-4 unified-card mb-4" variant="outlined">
    <p class="text-caption text-medium-emphasis mb-3">Match info</p>

    <v-alert
      v-if="!selectedGame"
      type="info"
      variant="tonal"
      class="mb-0"
    >
      <div class="d-flex flex-column ga-3">
        <span>{{ t("gamePage.sidebar.description") }}</span>
        <v-btn variant="outlined" size="small" prepend-icon="mdi-home" @click="gamePanelState.resetToCategories()">
          {{ t("gamePage.navigation.backToCategories") }}
        </v-btn>
      </div>
    </v-alert>

    <div v-else-if="!isGameStarted" class="d-flex flex-column ga-3">
      <v-chip variant="outlined" :color="gamePanelState.getLevelColor('mode')">
        {{ selectedPlayMode ? gamePanelState.modeLabel(selectedPlayMode) : "Mode non sélectionné" }}
      </v-chip>
      <v-chip
        :color="gamePanelState.canLaunchSelectedGame ? 'success' : 'warning'"
        variant="tonal"
      >
        {{ gamePanelState.canLaunchSelectedGame ? "Prêt à lancer" : "Configurer les options" }}
      </v-chip>
      <p v-if="selectedGame.difficultyKey" class="text-caption text-medium-emphasis mb-0">
        {{ t(selectedGame.difficultyKey) }}
      </p>
      <p
        v-if="selectedGame.id === 'belote'"
        class="text-caption text-medium-emphasis mb-0"
      >
        Variante: {{ gamePanelState.selectedBeloteMode === "free-for-all" ? "free-for-all" : "2v2" }}
      </p>
    </div>

    <div v-else-if="liveGamePanel" class="d-flex flex-column ga-3">
      <v-chip color="warning" variant="tonal" prepend-icon="mdi-timer-sand">
        Match en cours
      </v-chip>
      <h3 class="text-subtitle-1 font-weight-bold mb-0">{{ liveGamePanel.title }}</h3>
      <p
        v-for="(line, lineIndex) in liveGamePanel.summaryLines"
        :key="`panel-summary-${lineIndex}`"
        class="text-body-2 mb-0"
      >
        {{ line }}
      </p>
      <p class="text-caption text-medium-emphasis mb-0">{{ liveGamePanel.statusMessage }}</p>

      <div v-if="liveGamePanel.statsChips.length" class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="chip in liveGamePanel.statsChips"
          :key="`panel-chip-${chip.id}`"
          :color="chip.color"
          :variant="chip.variant ?? 'outlined'"
          :prepend-icon="chip.icon"
        >
          {{ chip.label }}: {{ chip.value }}
        </v-chip>
      </div>

      <div v-if="liveGamePanel.actions.length" class="d-flex flex-wrap ga-2">
        <v-btn
          v-for="action in liveGamePanel.actions"
          :key="`panel-action-${action.id}`"
          size="small"
          variant="outlined"
          :disabled="action.disabled"
        >
          {{ action.label }}
        </v-btn>
      </div>
    </div>

    <div v-else class="d-flex flex-column ga-3">
      <v-chip color="warning" variant="tonal" prepend-icon="mdi-timer-sand">
        Match en cours
      </v-chip>
      <p class="text-body-2 mb-0">
        {{ liveHintByGameId[selectedGame.id] ?? "Suivi live de la partie en cours." }}
      </p>
      <div v-if="selectedGame.tags?.length" class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="tag in selectedGame.tags"
          :key="`aside-live-${selectedGame.id}-${tag}`"
          size="x-small"
          variant="outlined"
        >
          {{ t(tag) }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>
