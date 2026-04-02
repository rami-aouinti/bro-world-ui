<script setup lang="ts">
import { computed, watch } from "vue";
import type { GameAsidePanelState } from "~/components/games/types";
import { useSolitaireEngine } from "~/composables/games/engines/useSolitaireEngine";

const props = defineProps<{
  selectedPlayMode: "ai" | "pvp";
}>();

const emit = defineEmits<{
  (event: "panel-state", payload: GameAsidePanelState): void;
}>();

const engine = useSolitaireEngine();

const suggestedMove = computed(() => engine.suggestBestMove());
const topWasteCard = computed(() => engine.waste.value.at(-1) ?? null);

const panelState = computed<GameAsidePanelState>(() => ({
  title: "Solitaire",
  subtitle: `Mode ${props.selectedPlayMode === "ai" ? "solo" : "duel local"}`,
  kpis: [
    { id: "solitaire-moves", label: "Coups", value: engine.moveCount.value },
    { id: "solitaire-score", label: "Score", value: engine.score.value },
  ],
  actions: [
    { id: "restart", label: "Nouvelle partie", icon: "mdi-refresh" },
    { id: "undo", label: "Annuler", icon: "mdi-undo" },
    { id: "hint", label: "Suggestion", icon: "mdi-lightbulb-on" },
  ],
}));

const applySuggestedMove = () => {
  if (!suggestedMove.value) return;
  engine.applyMove(suggestedMove.value);
};

const autoPlayAi = () => {
  if (props.selectedPlayMode !== "ai") return;
  if (!suggestedMove.value) return;
  engine.applyMove(suggestedMove.value);
};

const handleAsideAction = (actionId: string) => {
  if (actionId === "restart") {
    engine.startNewGame();
    return;
  }

  if (actionId === "undo") {
    engine.undo();
    return;
  }

  if (actionId === "hint") {
    applySuggestedMove();
  }
};

watch(panelState, (value) => emit("panel-state", value), { immediate: true });

defineExpose({
  handleAsideAction,
});
</script>

<template>
  <v-card class="pa-6">
    <v-card-title class="text-h5 d-flex align-center justify-space-between">
      <span>Solitaire</span>
      <v-chip v-if="engine.isWon.value" color="success" size="small">Victoire</v-chip>
    </v-card-title>

    <v-card-text class="d-flex flex-column ga-4">
      <div class="d-flex ga-4 align-center flex-wrap">
        <v-chip>Pioche: {{ engine.stock.value.length }}</v-chip>
        <v-chip>Défausse: {{ engine.waste.value.length }}</v-chip>
        <v-chip v-for="(pile, idx) in engine.foundations.value" :key="`foundation-${idx}`">
          Fondation {{ idx + 1 }}: {{ pile.length }}
        </v-chip>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <v-btn color="primary" variant="tonal" @click="engine.draw">Piocher</v-btn>
        <v-btn variant="tonal" @click="applySuggestedMove" :disabled="!suggestedMove">Jouer suggestion</v-btn>
        <v-btn variant="tonal" @click="engine.autoCompleteFoundations">Auto fondations</v-btn>
        <v-btn variant="text" @click="engine.undo">Undo</v-btn>
        <v-btn v-if="selectedPlayMode === 'ai'" variant="text" @click="autoPlayAi">IA joue</v-btn>
      </div>

      <div class="text-body-2">
        <strong>Carte défausse:</strong>
        <span v-if="topWasteCard">{{ topWasteCard.rank }}{{ topWasteCard.suit }}</span>
        <span v-else>Aucune</span>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <v-chip
          v-for="(pile, idx) in engine.tableau.value"
          :key="`tableau-${idx}`"
          size="small"
          color="secondary"
          variant="outlined"
        >
          Colonne {{ idx + 1 }}: {{ pile.length }} ({{ pile.filter((card) => card.faceUp).length }} visibles)
        </v-chip>
      </div>

      <p class="text-body-2 mb-0">{{ engine.message.value }}</p>
    </v-card-text>
  </v-card>
</template>
