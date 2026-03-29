<script setup lang="ts">
import { computed, ref } from "vue";
import BeloteGame from "~/components/games/BeloteGame.vue";
import CheckersGame from "~/components/games/CheckersGame.vue";
import RamiGame from "~/components/games/RamiGame.vue";
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";

const { t } = useI18n();

definePageMeta({
  splitShell: false,
});

type PlayMode = "ai" | "pvp";

interface GameEntry {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  component: "rami" | "belote" | "checkers" | null;
  supportedModes: PlayMode[];
}

interface GameSubCategory {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  games: GameEntry[];
}

interface GameCategory {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  subCategories: GameSubCategory[];
}

const categories: GameCategory[] = [
  {
    id: "cards",
    nameKey: "gamePage.catalog.categories.cards.name",
    descriptionKey: "gamePage.catalog.categories.cards.description",
    icon: "mdi-cards-playing-outline",
    subCategories: [
      {
        id: "classic-cards",
        nameKey: "gamePage.catalog.subCategories.classicCards.name",
        descriptionKey: "gamePage.catalog.subCategories.classicCards.description",
        icon: "mdi-cards-outline",
        games: [
          {
            id: "rami",
            nameKey: "gamePage.catalog.games.rami.name",
            descriptionKey: "gamePage.catalog.games.rami.description",
            icon: "mdi-cards-diamond-outline",
            component: "rami",
            supportedModes: ["ai", "pvp"],
          },
          {
            id: "belote",
            nameKey: "gamePage.catalog.games.belote.name",
            descriptionKey: "gamePage.catalog.games.belote.description",
            icon: "mdi-cards-club-outline",
            component: "belote",
            supportedModes: ["ai"],
          },
          {
            id: "poker",
            nameKey: "gamePage.catalog.games.poker.name",
            descriptionKey: "gamePage.catalog.games.poker.description",
            icon: "mdi-cards-spade-outline",
            component: null,
            supportedModes: [],
          },
        ],
      },
    ],
  },
  {
    id: "board",
    nameKey: "gamePage.catalog.categories.board.name",
    descriptionKey: "gamePage.catalog.categories.board.description",
    icon: "mdi-checkerboard",
    subCategories: [
      {
        id: "table-classic",
        nameKey: "gamePage.catalog.subCategories.tableClassic.name",
        descriptionKey: "gamePage.catalog.subCategories.tableClassic.description",
        icon: "mdi-gamepad-round-outline",
        games: [
          {
            id: "checkers",
            nameKey: "gamePage.catalog.games.checkers.name",
            descriptionKey: "gamePage.catalog.games.checkers.description",
            icon: "mdi-circle-multiple-outline",
            component: "checkers",
            supportedModes: ["pvp"],
          },
        ],
      },
    ],
  },
];

const selectedCategoryId = ref<string | null>(null);
const selectedSubCategoryId = ref<string | null>(null);
const selectedGameId = ref<string | null>(null);
const selectedPlayMode = ref<PlayMode | null>(null);
const isGameStarted = ref(false);

const selectedCategory = computed(
  () =>
    categories.find((category) => category.id === selectedCategoryId.value) ??
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
const canLaunchSelectedGame = computed(
  () =>
    Boolean(selectedGame.value?.component) &&
    Boolean(
      selectedPlayMode.value &&
      selectedGame.value?.supportedModes.includes(selectedPlayMode.value),
    ),
);

const modeLabel = (mode: PlayMode) =>
  mode === "ai"
    ? t("gamePage.modes.vsComputer")
    : t("gamePage.modes.vsPlayer");

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

const openCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId;
  selectedSubCategoryId.value = null;
  selectedGameId.value = null;
  selectedPlayMode.value = null;
  isGameStarted.value = false;
};

const openSubCategory = (subCategoryId: string) => {
  selectedSubCategoryId.value = subCategoryId;
  selectedGameId.value = null;
  selectedPlayMode.value = null;
  isGameStarted.value = false;
};

const openGame = (gameId: string) => {
  selectedGameId.value = gameId;
  selectedPlayMode.value = null;
  isGameStarted.value = false;
};

const resetToCategories = () => {
  selectedCategoryId.value = null;
  selectedSubCategoryId.value = null;
  selectedGameId.value = null;
  selectedPlayMode.value = null;
  isGameStarted.value = false;
};

const selectPlayMode = (mode: PlayMode) => {
  if (!selectedGame.value?.supportedModes.includes(mode)) {
    return;
  }

  selectedPlayMode.value = mode;
  isGameStarted.value = false;
};

const launchGame = () => {
  if (!canLaunchSelectedGame.value) {
    return;
  }

  isGameStarted.value = true;
};
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <div class="mb-4">
        <v-chip variant="outlined" prepend-icon="mdi-controller" class="mb-2">{{ t("gamePage.sidebar.badge") }}</v-chip>
        <h1 class="page-title mb-2">{{ t("gamePage.sidebar.title") }}</h1>
        <p class="section-subtitle mb-0">
          {{ t("gamePage.sidebar.description") }}
        </p>
      </div>
      <div class="d-flex flex-column ga-2 mb-4">
        <v-btn variant="outlined" prepend-icon="mdi-home" @click="resetToCategories">{{ t("gamePage.navigation.backToCategories") }}</v-btn>
        <v-btn v-if="selectedGame" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedGameId = null">
          {{ t("gamePage.navigation.backToGames") }}
        </v-btn>
        <v-btn v-if="selectedSubCategory" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedSubCategoryId = null">
          {{ t("gamePage.navigation.backToSubCategories") }}
        </v-btn>
      </div>
    </template>
    <template #aside>
      <div class="d-flex align-center ga-2 mb-2">
        <v-avatar :color="getLevelColor('info')" size="28" variant="tonal">
          <v-icon icon="mdi-information-outline" size="18" />
        </v-avatar>
        <h2 class="text-subtitle-1 font-weight-bold mb-0">{{ t("gamePage.info.title") }}</h2>
      </div>
      <ul class="info-list text-body-2">
        <li>
          <strong>{{ t("gamePage.info.category") }}:</strong> {{ selectedCategory ? t(selectedCategory.nameKey) : "—" }}
        </li>
        <li>
          <strong>{{ t("gamePage.info.subCategory") }}:</strong>
          {{ selectedSubCategory ? t(selectedSubCategory.nameKey) : "—" }}
        </li>
        <li><strong>{{ t("gamePage.info.game") }}:</strong> {{ selectedGame ? t(selectedGame.nameKey) : "—" }}</li>
        <li>
          <strong>{{ t("gamePage.info.mode") }}:</strong>
          {{ selectedPlayMode ? modeLabel(selectedPlayMode) : "—" }}
        </li>
        <li><strong>{{ t("gamePage.info.status") }}:</strong> {{ gameStatusLabel }}</li>
      </ul>
      <div class="d-flex align-center flex-wrap ga-2 mb-0">
        <v-chip v-if="selectedCategory" prepend-icon="mdi-folder-open-outline" :color="getLevelColor('category')">{{ t(selectedCategory.nameKey) }}</v-chip>
        <v-chip v-if="selectedSubCategory" prepend-icon="mdi-shape-outline" :color="getLevelColor('subCategory')">{{ t(selectedSubCategory.nameKey) }}</v-chip>
        <v-chip v-if="selectedGame" prepend-icon="mdi-play-circle-outline" :color="getLevelColor('game')">{{ t(selectedGame.nameKey) }}</v-chip>
      </div>
    </template>
    <template #default>
      <section v-if="!selectedCategory" class="mb-4">
        <h2 class="section-title mb-1">{{ t("gamePage.steps.categories.title") }}</h2>
        <p class="section-subtitle mb-4">
          {{ t("gamePage.steps.categories.description") }}
        </p>
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="category in categories"
            :key="category.id"
            cols="12"
            md="6"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex align-start ga-3">
                <v-avatar :color="getLevelColor('category')" variant="tonal"><v-icon :icon="category.icon" /></v-avatar>
                <div>
                  <h3 class="card-title mb-1">{{ t(category.nameKey) }}</h3>
                  <p class="card-description mb-3">
                    {{ t(category.descriptionKey) }}
                  </p>
                  <v-btn
                    :color="getLevelColor('category')"
                    variant="flat"
                    @click="openCategory(category.id)"
                    >{{ t("gamePage.actions.viewSubCategories") }}</v-btn
                  >
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
        <h2 class="section-title mb-1">
          {{ t("gamePage.steps.subCategories.title", { category: t(selectedCategory.nameKey) }) }}
        </h2>
        <p class="section-subtitle mb-4">{{ t("gamePage.steps.subCategories.description") }}</p>
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="subCategory in selectedCategory.subCategories"
            :key="subCategory.id"
            cols="12"
            md="6"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex align-start ga-3">
                <v-avatar :color="getLevelColor('subCategory')" variant="tonal"><v-icon :icon="subCategory.icon" /></v-avatar>
                <div>
                  <h3 class="card-title mb-1">{{ t(subCategory.nameKey) }}</h3>
                  <p class="card-description mb-3">
                    {{ t(subCategory.descriptionKey) }}
                  </p>
                  <v-btn
                    :color="getLevelColor('subCategory')"
                    variant="flat"
                    @click="openSubCategory(subCategory.id)"
                    >{{ t("gamePage.actions.viewGames") }}</v-btn
                  >
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else-if="selectedSubCategory && !selectedGame" class="mb-4">
        <h2 class="section-title mb-1">
          {{ t("gamePage.steps.games.title", { subCategory: t(selectedSubCategory.nameKey) }) }}
        </h2>
        <p class="section-subtitle mb-4">{{ t("gamePage.steps.games.description") }}</p>
        <v-row class="ga-0 ga-md-1">
          <v-col
            v-for="game in selectedSubCategory.games"
            :key="game.id"
            cols="12"
            md="6"
            xl="4"
          >
            <v-card
              class="pa-4 h-100 unified-card interactive-card"
              variant="outlined"
            >
              <div class="d-flex flex-column ga-2 h-100">
                <v-avatar :color="getLevelColor('game')" variant="tonal"><v-icon :icon="game.icon" /></v-avatar>
                <h3 class="card-title mb-0">{{ t(game.nameKey) }}</h3>
                <p class="card-description">{{ t(game.descriptionKey) }}</p>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="mode in game.supportedModes"
                    :key="`${game.id}-${mode}`"
                    size="small"
                    variant="tonal"
                    :color="getLevelColor('mode')"
                  >
                    {{ modeLabel(mode) }}
                  </v-chip>
                  <v-chip
                    v-if="!game.supportedModes.length"
                    size="small"
                    variant="outlined"
                    color="warning"
                  >
                    {{ t("gamePage.status.comingSoon") }}
                  </v-chip>
                </div>
                <v-spacer />
                <v-btn
                  :color="getLevelColor('game')"
                  variant="flat"
                  :disabled="!game.component || !game.supportedModes.length"
                  @click="openGame(game.id)"
                >
                  {{ game.component ? t("gamePage.actions.chooseGame") : t("gamePage.status.comingSoon") }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else-if="selectedGame && !isGameStarted" class="mb-1">
        <h2 class="section-title mb-1">
          {{ t("gamePage.steps.mode.title", { game: t(selectedGame.nameKey) }) }}
        </h2>
        <p class="section-subtitle mb-4">
          {{ t("gamePage.steps.mode.description") }}
        </p>
        <v-card class="pa-4 unified-card" variant="outlined">
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              :color="getLevelColor('mode')"
              :variant="selectedPlayMode === 'ai' ? 'flat' : 'outlined'"
              :disabled="!selectedGame.supportedModes.includes('ai')"
              @click="selectPlayMode('ai')"
            >
              {{ modeLabel("ai") }}
            </v-btn>
            <v-btn
              :color="getLevelColor('subCategory')"
              :variant="selectedPlayMode === 'pvp' ? 'flat' : 'outlined'"
              :disabled="!selectedGame.supportedModes.includes('pvp')"
              @click="selectPlayMode('pvp')"
            >
              {{ modeLabel("pvp") }}
            </v-btn>
          </div>

          <v-alert
            v-if="
              !selectedGame.supportedModes.length || !selectedGame.component
            "
            type="info"
            variant="tonal"
            class="mb-4"
          >
            {{ t("gamePage.status.soonHint") }}
          </v-alert>

          <v-btn
            :color="getLevelColor('game')"
            :disabled="!canLaunchSelectedGame"
            @click="launchGame"
          >
            {{ t("gamePage.actions.launchGame") }}
          </v-btn>
        </v-card>
      </section>

      <section v-else-if="selectedGame && selectedPlayMode && isGameStarted">
        <RamiGame
          v-if="selectedGame.component === 'rami'"
          :selected-play-mode="selectedPlayMode"
        />
        <BeloteGame
          v-else-if="selectedGame.component === 'belote'"
          :selected-play-mode="selectedPlayMode"
        />
        <CheckersGame
          v-else-if="selectedGame.component === 'checkers'"
          :selected-play-mode="selectedPlayMode"
        />
      </section>
    </template>
  </PlatformSplitLayout>
</template>

<style scoped>
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

.card-description {
  font-size: 0.93rem;
  color: rgba(var(--v-theme-on-surface), 0.74);
}

.info-list {
  margin: 0;
  padding-left: 1rem;
  display: grid;
  gap: 0.35rem;
}

@media (max-width: 959px) {
  .unified-shell,
  .unified-card {
    border-radius: 14px;
  }
}
</style>
