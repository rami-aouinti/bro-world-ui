<script setup lang="ts">
import type { ConceptPlayMode, GameDevelopmentStatus } from "~/types/game";

const props = withDefaults(defineProps<{
  nameKey: string;
  descriptionKey: string;
  plannedModes: ConceptPlayMode[];
  difficultyKey?: string | null;
  features?: string[];
  tags?: string[];
  artDirection?: string | null;
  averageDuration?: string | null;
  developmentStatus: GameDevelopmentStatus;
}>(), {
  difficultyKey: null,
  features: () => [],
  tags: () => [],
  artDirection: null,
  averageDuration: null,
});

const { t, te } = useI18n();

const fallbackValue = "—";

const gameplayLoop = computed(() => props.features.filter(Boolean).slice(0, 5));

const displayModes = computed(() =>
  props.plannedModes
    .map((mode) => {
      if (mode === "ai") return "AI";
      if (mode === "pvp") return "PvP";
      return "Online";
    }),
);

const progressionLabel = computed(() => {
  if (props.developmentStatus === "prototype") return "Prototypage";
  if (props.developmentStatus === "coming_soon") return "Conception";
  return "Développement";
});

const resolveText = (value?: string | null) => {
  if (!value) return fallbackValue;
  return te(value) ? t(value) : value;
};
</script>

<template>
  <v-card variant="outlined" class="pa-4 d-flex flex-column ga-4">
    <div>
      <p class="text-caption text-medium-emphasis mb-1">Vision du jeu</p>
      <p class="text-body-1 font-weight-medium mb-1">{{ resolveText(nameKey) }}</p>
      <p class="text-body-2 mb-0">{{ resolveText(descriptionKey) }}</p>
    </div>

    <div>
      <p class="text-caption text-medium-emphasis mb-1">Boucle de gameplay</p>
      <ol v-if="gameplayLoop.length" class="pl-5 mb-0">
        <li v-for="(step, index) in gameplayLoop" :key="`loop-step-${index}-${step}`" class="mb-1">
          {{ resolveText(step) }}
        </li>
      </ol>
      <p v-else class="text-body-2 mb-0">{{ fallbackValue }}</p>
    </div>

    <div>
      <p class="text-caption text-medium-emphasis mb-2">Modes prévus</p>
      <div class="d-flex flex-wrap ga-2">
        <v-chip v-for="mode in displayModes" :key="`planned-mode-${mode}`" size="small" color="primary" variant="tonal">
          {{ mode }}
        </v-chip>
      </div>
    </div>

    <div class="d-flex flex-wrap ga-2">
      <v-chip size="small" variant="outlined">Difficulté: {{ resolveText(difficultyKey) }}</v-chip>
      <v-chip size="small" variant="outlined">Durée moyenne: {{ resolveText(averageDuration) }}</v-chip>
      <v-chip size="small" color="warning" variant="tonal">Progression: {{ progressionLabel }}</v-chip>
    </div>

    <div v-if="tags.length" class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="tag in tags"
        :key="`concept-tag-${tag}`"
        size="small"
        color="secondary"
        variant="tonal"
      >
        {{ resolveText(tag) }}
      </v-chip>
    </div>

    <div>
      <p class="text-caption text-medium-emphasis mb-1">Direction artistique</p>
      <p class="text-body-2 mb-0">{{ resolveText(artDirection) }}</p>
    </div>
  </v-card>
</template>
