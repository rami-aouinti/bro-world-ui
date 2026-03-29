<script setup lang="ts">
import { computed, ref } from "vue";
import BeloteGame from "~/components/games/BeloteGame.vue";
import CheckersGame from "~/components/games/CheckersGame.vue";
import RamiGame from "~/components/games/RamiGame.vue";
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";

definePageMeta({
  splitShell: false,
});

type PlayMode = "ai" | "pvp";

interface GameEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: "rami" | "belote" | "checkers" | null;
  supportedModes: PlayMode[];
}

interface GameSubCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  games: GameEntry[];
}

interface GameCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subCategories: GameSubCategory[];
}

const categories: GameCategory[] = [
  {
    id: "cards",
    name: "Jeux de cartes",
    description:
      "Sélectionnez un jeu de cartes traditionnel puis jouez directement.",
    icon: "mdi-cards-playing-outline",
    subCategories: [
      {
        id: "classic-cards",
        name: "Cartes classiques",
        description: "Rami, Belote, et d'autres jeux populaires.",
        icon: "mdi-cards-outline",
        games: [
          {
            id: "rami",
            name: "Rami",
            description: "Créez des suites ou brelans pour vider votre main.",
            icon: "mdi-cards-diamond-outline",
            component: "rami",
            supportedModes: ["ai", "pvp"],
          },
          {
            id: "belote",
            name: "Belote",
            description: "Version rapide en 8 plis contre une IA.",
            icon: "mdi-cards-club-outline",
            component: "belote",
            supportedModes: ["ai"],
          },
          {
            id: "poker",
            name: "Poker (bientôt)",
            description: "Mode Texas Hold'em à venir prochainement.",
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
    name: "Jeux de table",
    description: "Des jeux de plateau simples et conviviaux.",
    icon: "mdi-checkerboard",
    subCategories: [
      {
        id: "table-classic",
        name: "Classiques de table",
        description: "Commencez avec le jeu de dames complet.",
        icon: "mdi-gamepad-round-outline",
        games: [
          {
            id: "checkers",
            name: "Dames",
            description: "Jeu de dames local 2 joueurs sur le même écran.",
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
const gameStatusLabel = computed(() => {
  if (!selectedGame.value) return "Aucun jeu sélectionné";

  if (isGameStarted.value) return "Partie en cours";

  if (canLaunchSelectedGame.value) return "Prêt à lancer";

  return "Sélection en cours";
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
        <v-chip variant="outlined" prepend-icon="mdi-controller" class="mb-2"
        >Game Center</v-chip
        >
        <h1 class="page-title mb-2">Espace Jeux</h1>
        <p class="section-subtitle mb-0">
          Choisissez une catégorie, une sous-catégorie puis lancez votre jeu.
        </p>
      </div>
      <div class="d-flex flex-column ga-2 mb-4">
        <v-btn
            variant="outlined"
            prepend-icon="mdi-home"
            @click="resetToCategories"
        >Retour catégories</v-btn
        >
        <v-btn
            v-if="selectedGame"
            variant="tonal"
            prepend-icon="mdi-arrow-left"
            @click="selectedGameId = null"
        >
          Retour jeux
        </v-btn>
        <v-btn
            v-if="selectedSubCategory"
            variant="tonal"
            prepend-icon="mdi-arrow-left"
            @click="selectedSubCategoryId = null"
        >
          Retour sous-catégories
        </v-btn>
      </div>
    </template>
    <template #aside>
      <div class="d-flex align-center ga-2 mb-2">
        <v-avatar :color="getLevelColor('info')" size="28" variant="tonal">
          <v-icon icon="mdi-information-outline" size="18" />
        </v-avatar>
        <h2 class="text-subtitle-1 font-weight-bold mb-0">Infos partie</h2>
      </div>
      <ul class="info-list text-body-2">
        <li>
          <strong>Catégorie :</strong> {{ selectedCategory?.name ?? "—" }}
        </li>
        <li>
          <strong>Sous-catégorie :</strong>
          {{ selectedSubCategory?.name ?? "—" }}
        </li>
        <li><strong>Jeu :</strong> {{ selectedGame?.name ?? "—" }}</li>
        <li>
          <strong>Mode :</strong>
          {{
            selectedPlayMode === "ai"
                ? "Contre ordinateur"
                : selectedPlayMode === "pvp"
                    ? "Contre un joueur"
                    : "—"
          }}
        </li>
        <li><strong>État :</strong> {{ gameStatusLabel }}</li>
      </ul>
      <div class="d-flex align-center flex-wrap ga-2 mb-0">
        <v-chip
            v-if="selectedCategory"
            prepend-icon="mdi-folder-open-outline"
            :color="getLevelColor('category')"
        >{{ selectedCategory.name }}</v-chip
        >
        <v-chip
            v-if="selectedSubCategory"
            prepend-icon="mdi-shape-outline"
            :color="getLevelColor('subCategory')"
        >{{ selectedSubCategory.name }}</v-chip
        >
        <v-chip
            v-if="selectedGame"
            prepend-icon="mdi-play-circle-outline"
            :color="getLevelColor('game')"
        >{{ selectedGame.name }}</v-chip
        >
      </div>
    </template>
    <template #default>
      <section v-if="!selectedCategory" class="mb-4">
        <h2 class="section-title mb-1">1) Catégories</h2>
        <p class="section-subtitle mb-4">
          Choisissez une famille de jeux pour continuer.
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
                <v-avatar :color="getLevelColor('category')" variant="tonal"
                  ><v-icon :icon="category.icon"
                /></v-avatar>
                <div>
                  <h3 class="card-title mb-1">{{ category.name }}</h3>
                  <p class="card-description mb-3">
                    {{ category.description }}
                  </p>
                  <v-btn
                    :color="getLevelColor('category')"
                    variant="flat"
                    @click="openCategory(category.id)"
                    >Voir sous-catégories</v-btn
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
          2) Sous-catégories · {{ selectedCategory.name }}
        </h2>
        <p class="section-subtitle mb-4">Affinez votre choix de jeux.</p>
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
                <v-avatar :color="getLevelColor('subCategory')" variant="tonal"
                  ><v-icon :icon="subCategory.icon"
                /></v-avatar>
                <div>
                  <h3 class="card-title mb-1">{{ subCategory.name }}</h3>
                  <p class="card-description mb-3">
                    {{ subCategory.description }}
                  </p>
                  <v-btn
                    :color="getLevelColor('subCategory')"
                    variant="flat"
                    @click="openSubCategory(subCategory.id)"
                    >Voir les jeux</v-btn
                  >
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else-if="selectedSubCategory && !selectedGame" class="mb-4">
        <h2 class="section-title mb-1">
          3) Jeux · {{ selectedSubCategory.name }}
        </h2>
        <p class="section-subtitle mb-4">Sélectionnez un jeu et son mode.</p>
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
                <v-avatar :color="getLevelColor('game')" variant="tonal"
                  ><v-icon :icon="game.icon"
                /></v-avatar>
                <h3 class="card-title mb-0">{{ game.name }}</h3>
                <p class="card-description">{{ game.description }}</p>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="mode in game.supportedModes"
                    :key="`${game.id}-${mode}`"
                    size="small"
                    variant="tonal"
                    :color="getLevelColor('mode')"
                  >
                    {{
                      mode === "ai" ? "Contre ordinateur" : "Contre un joueur"
                    }}
                  </v-chip>
                  <v-chip
                    v-if="!game.supportedModes.length"
                    size="small"
                    variant="outlined"
                    color="warning"
                  >
                    Bientôt disponible
                  </v-chip>
                </div>
                <v-spacer />
                <v-btn
                  :color="getLevelColor('game')"
                  variant="flat"
                  :disabled="!game.component || !game.supportedModes.length"
                  @click="openGame(game.id)"
                >
                  {{ game.component ? "Choisir ce jeu" : "Bientôt disponible" }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </section>

      <section v-else-if="selectedGame && !isGameStarted" class="mb-1">
        <h2 class="section-title mb-1">
          4) Mode de partie · {{ selectedGame.name }}
        </h2>
        <p class="section-subtitle mb-4">
          Choisissez un mode puis lancez votre partie.
        </p>
        <v-card class="pa-4 unified-card" variant="outlined">
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              :color="getLevelColor('mode')"
              :variant="selectedPlayMode === 'ai' ? 'flat' : 'outlined'"
              :disabled="!selectedGame.supportedModes.includes('ai')"
              @click="selectPlayMode('ai')"
            >
              Contre ordinateur
            </v-btn>
            <v-btn
              :color="getLevelColor('subCategory')"
              :variant="selectedPlayMode === 'pvp' ? 'flat' : 'outlined'"
              :disabled="!selectedGame.supportedModes.includes('pvp')"
              @click="selectPlayMode('pvp')"
            >
              Contre un joueur
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
            Ce jeu sera disponible prochainement. Revenez bientôt !
          </v-alert>

          <v-btn
            :color="getLevelColor('game')"
            :disabled="!canLaunchSelectedGame"
            @click="launchGame"
          >
            Lancer le jeu
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
