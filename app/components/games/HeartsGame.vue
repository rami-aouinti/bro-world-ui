<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { GameAsidePanelState } from "~/components/games/types";

const props = defineProps<{
  selectedPlayMode: "ai" | "pvp";
}>();

const emit = defineEmits<{
  (event: "panel-state", payload: GameAsidePanelState): void;
}>();

const handCount = ref(0);

const panelState = computed<GameAsidePanelState>(() => ({
  title: "Hearts",
  subtitle: `Mode ${props.selectedPlayMode === "ai" ? "solo" : "duel local"}`,
  kpis: [{ id: "hearts-hands", label: "Manches", value: handCount.value }],
  actions: [{ id: "new-hand", label: "Nouvelle manche", icon: "mdi-cards" }],
}));

const handleAsideAction = (actionId: string) => {
  if (actionId === "new-hand") {
    handCount.value += 1;
  }
};

watch(panelState, (value) => emit("panel-state", value), { immediate: true });

defineExpose({
  handleAsideAction,
});
</script>

<template>
  <v-card class="pa-6">
    <v-card-title class="text-h5">Hearts</v-card-title>
    <v-card-text>
      Prototype jouable en cours d’intégration.
    </v-card-text>
  </v-card>
</template>
