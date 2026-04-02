<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { GameAsidePanelState } from "~/components/games/types";
import type { PlayMode } from "~/types/game";
import type { SessionResult } from "~/composables/api/useGameSessionsApi";

const props = defineProps<{
  selectedPlayMode: PlayMode;
}>();

const emit = defineEmits<{
  (event: "panel-state", payload: GameAsidePanelState): void;
  (event: "game-finished", payload: { result: SessionResult }): void;
}>();

const TICK_MS = 40;
const GRAVITY = 0.9;
const JUMP_BOOST = -9;
const OBSTACLE_SPEED = 3.2;
const FIELD_HEIGHT = 320;
const FIELD_WIDTH = 760;
const ROCKET_X = 120;
const ROCKET_SIZE = 28;
const GAP_SIZE = 110;
const WIN_SCORE = 12;

const rocketY = ref(FIELD_HEIGHT / 2);
const velocity = ref(0);
const obstacleX = ref(FIELD_WIDTH + 40);
const obstacleGapY = ref(110);
const score = ref(0);
const bestScore = ref(0);
const isRunning = ref(false);
const isGameOver = ref(false);
const hasFinished = ref(false);
let gameLoop: ReturnType<typeof setInterval> | null = null;

const rocketStyle = computed(() => ({
  left: `${ROCKET_X}px`,
  top: `${rocketY.value}px`,
  transform: `rotate(${Math.max(-30, Math.min(50, velocity.value * 3))}deg)`,
}));

const topObstacleStyle = computed(() => ({
  left: `${obstacleX.value}px`,
  height: `${obstacleGapY.value}px`,
}));

const bottomObstacleStyle = computed(() => ({
  left: `${obstacleX.value}px`,
  top: `${obstacleGapY.value + GAP_SIZE}px`,
  height: `${FIELD_HEIGHT - (obstacleGapY.value + GAP_SIZE)}px`,
}));

const panelState = computed<GameAsidePanelState>(() => ({
  gameKey: "flappy-rocket",
  title: "Flappy Rocket",
  phase: isGameOver.value ? "Crash" : isRunning.value ? "En vol" : "Prêt",
  turnLabel: props.selectedPlayMode === "ai" ? "Mode assisté" : "Mode manuel",
  status: isGameOver.value
    ? "Relance une partie"
    : `Passe entre les obstacles (${WIN_SCORE} pour gagner)`,
  highlights: [
    `Score ${score.value}`,
    `Record ${bestScore.value}`,
    "Appuie sur Espace pour monter",
  ],
  kpis: [
    { id: "score", label: "Score", value: score.value, color: "primary" },
    { id: "best", label: "Record", value: bestScore.value, color: "success" },
  ],
  actions: [
    { id: "jump", label: "Monter", disabled: isGameOver.value },
    { id: "restart", label: "Rejouer" },
  ],
}));

const stopLoop = () => {
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }
};

const randomGap = () => 50 + Math.floor(Math.random() * (FIELD_HEIGHT - GAP_SIZE - 100));

const resetGame = () => {
  rocketY.value = FIELD_HEIGHT / 2;
  velocity.value = 0;
  obstacleX.value = FIELD_WIDTH + 40;
  obstacleGapY.value = randomGap();
  score.value = 0;
  isRunning.value = true;
  isGameOver.value = false;
  hasFinished.value = false;
};

const finishGame = (result: SessionResult) => {
  if (hasFinished.value) return;
  hasFinished.value = true;
  emit("game-finished", { result });
};

const crash = () => {
  isGameOver.value = true;
  isRunning.value = false;
  stopLoop();
  finishGame("lose");
};

const tick = () => {
  if (!isRunning.value || isGameOver.value) return;

  velocity.value += GRAVITY;
  rocketY.value += velocity.value;
  obstacleX.value -= OBSTACLE_SPEED;

  if (obstacleX.value < -70) {
    obstacleX.value = FIELD_WIDTH + 30;
    obstacleGapY.value = randomGap();
    score.value += 1;
    bestScore.value = Math.max(bestScore.value, score.value);

    if (score.value >= WIN_SCORE) {
      isGameOver.value = true;
      isRunning.value = false;
      stopLoop();
      finishGame("win");
    }
  }

  const rocketBottom = rocketY.value + ROCKET_SIZE;
  const inObstacleRange = obstacleX.value < ROCKET_X + ROCKET_SIZE && obstacleX.value + 60 > ROCKET_X;
  const hitsTop = rocketY.value <= obstacleGapY.value;
  const hitsBottom = rocketBottom >= obstacleGapY.value + GAP_SIZE;

  if (rocketY.value <= 0 || rocketBottom >= FIELD_HEIGHT || (inObstacleRange && (hitsTop || hitsBottom))) {
    crash();
  }
};

const jump = () => {
  if (!isRunning.value || isGameOver.value) return;
  velocity.value = JUMP_BOOST;
};

const startLoop = () => {
  stopLoop();
  gameLoop = setInterval(tick, TICK_MS);
};

const handleAsideAction = (actionId: string) => {
  if (actionId === "restart") {
    resetGame();
    startLoop();
    return;
  }

  if (actionId === "jump") {
    jump();
  }
};

defineExpose({
  handleAsideAction,
});

const onKeydown = (event: KeyboardEvent) => {
  if (event.code === "Space") {
    event.preventDefault();
    jump();
  }
  if (event.code === "KeyR") {
    event.preventDefault();
    handleAsideAction("restart");
  }
};

watch(panelState, (value) => emit("panel-state", value), { immediate: true });

onMounted(() => {
  resetGame();
  startLoop();
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  stopLoop();
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <section class="flappy-rocket-game">
    <header class="mb-4 d-flex align-center justify-space-between ga-3 flex-wrap">
      <div>
        <h3 class="text-h5 mb-1">Flappy Rocket</h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Espace: monter · R: recommencer
        </p>
      </div>
      <div class="d-flex ga-2 align-center">
        <v-chip color="primary" variant="tonal">Score: {{ score }}</v-chip>
        <v-chip color="success" variant="tonal">Record: {{ bestScore }}</v-chip>
      </div>
    </header>

    <div class="game-field">
      <div class="obstacle obstacle--top" :style="topObstacleStyle" />
      <div class="obstacle obstacle--bottom" :style="bottomObstacleStyle" />
      <div class="rocket" :style="rocketStyle">🚀</div>
      <div v-if="isGameOver" class="overlay">
        <p class="text-h6 mb-3">{{ score >= WIN_SCORE ? "Mission réussie" : "Crash détecté" }}</p>
        <v-btn color="primary" @click="handleAsideAction('restart')">Rejouer</v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flappy-rocket-game {
  width: 100%;
}

.game-field {
  position: relative;
  height: 320px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-primary), 0.45);
  background:
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.28), transparent 30%),
    linear-gradient(180deg, rgba(14, 31, 70, 0.95), rgba(6, 12, 28, 0.98));
}

.obstacle {
  position: absolute;
  width: 60px;
  background: linear-gradient(180deg, #00e5ff, #0ea5e9);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.45);
}

.obstacle--top {
  top: 0;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.obstacle--bottom {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.rocket {
  position: absolute;
  z-index: 2;
  font-size: 26px;
  transition: transform 0.05s linear;
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  background: rgba(3, 9, 20, 0.68);
}
</style>
