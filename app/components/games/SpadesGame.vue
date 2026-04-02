<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { GameAsidePanelState } from "~/components/games/types";

const props = defineProps<{
  selectedPlayMode: "ai" | "pvp";
}>();

const emit = defineEmits<{
  (event: "panel-state", payload: GameAsidePanelState): void;
}>();

const trickCount = ref(0);

const panelState = computed<GameAsidePanelState>(() => ({
  title: "Spades",
  subtitle: `Mode ${props.selectedPlayMode === "ai" ? "solo" : "duel local"}`,
  kpis: [{ id: "spades-tricks", label: "Plis", value: trickCount.value }],
  actions: [{ id: "next-hand", label: "Main suivante", icon: "mdi-cards-playing-spade" }],
}));

const handleAsideAction = (actionId: string) => {
  if (actionId === "next-hand") {
    trickCount.value += 1;
  }
};

watch(panelState, (value) => emit("panel-state", value), { immediate: true });

defineExpose({
  handleAsideAction,
});
</script>

<template>
  <v-card class="pa-6">
    <v-card-title class="text-h5">Spades</v-card-title>
    <v-card-text>
      Prototype jouable en cours d’intégration.
    </v-card-text>
  </v-card>
</template>
