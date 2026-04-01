import type {
  ApiGameCategory,
  ApiGameEntry,
  ApiPlayMode,
  GameCategory,
  GameEntry,
  PlayMode,
} from "~/types/game";

const apiToUiPlayModeMap: Record<ApiPlayMode, PlayMode | null> = {
  solo: "ai",
  versus: "pvp",
  online: null,
  endless: null,
  ai: "ai",
  pvp: "pvp",
};

export const mapApiPlayModeToUiMode = (mode: ApiPlayMode): PlayMode | null =>
  apiToUiPlayModeMap[mode] ?? null;

const mapGameEntry = (game: ApiGameEntry): GameEntry => ({
  ...game,
  supportedModes: Array.from(
    new Set(
      game.supportedModes
        .map((mode) => mapApiPlayModeToUiMode(mode))
        .filter((mode): mode is PlayMode => Boolean(mode)),
    ),
  ),
});

export const mapGameCatalogFromApi = (
  categories: ApiGameCategory[],
): GameCategory[] =>
  categories.map((category) => ({
    ...category,
    subCategories: category.subCategories.map((subCategory) => ({
      ...subCategory,
      games: subCategory.games.map(mapGameEntry),
    })),
  }));
