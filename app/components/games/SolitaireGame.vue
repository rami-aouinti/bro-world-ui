<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { GameAsidePanelState } from "~/components/games/types";

const props = defineProps<{
  selectedPlayMode: "ai" | "pvp";
}>();

const emit = defineEmits<{
  (event: "panel-state", payload: GameAsidePanelState): void;
}>();

const restartSeed = ref(0);

const panelState = computed<GameAsidePanelState>(() => ({
  title: "Solitaire",
  subtitle: `Mode ${props.selectedPlayMode === "ai" ? "solo" : "duel local"}`,
  kpis: [
    { id: "solitaire-draw", label: "Tirages", value: restartSeed.value },
  ],
  actions: [{ id: "restart", label: "Nouvelle partie", icon: "mdi-refresh" }],
}));

const handleAsideAction = (actionId: string) => {
  if (actionId === "restart") {
    restartSeed.value += 1;
  }
};

watch(panelState, (value) => emit("panel-state", value), { immediate: true });

defineExpose({
  handleAsideAction,
});
</script>

<template>
  <v-card class="pa-6">
    <v-card-title class="text-h5">Solitaire</v-card-title>
    <v-card-text>
      Prototype jouable en cours d’intégration.
    </v-card-text>
  </v-card>
</template>
