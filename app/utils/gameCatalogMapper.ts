import type {
  ApiGameCategory,
  ApiGameEntry,
  ApiPlayMode,
  GameCategory,
  GameDevelopmentStatus,
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

const mapApiModesToUiModes = (modes: ApiPlayMode[] = []): PlayMode[] =>
  Array.from(
    new Set(
      modes
        .map((mode) => mapApiPlayModeToUiMode(mode))
        .filter((mode): mode is PlayMode => Boolean(mode)),
    ),
  );

const resolveDevelopmentStatus = (
  game: ApiGameEntry,
  mappedModes: PlayMode[],
): GameDevelopmentStatus => {
  if (game.developmentStatus) {
    return game.developmentStatus;
  }

  return game.component && mappedModes.length ? "playable" : "coming_soon";
};

const mapGameEntry = (game: ApiGameEntry): GameEntry => {
  const mappedModes = mapApiModesToUiModes(
    game.availableModes?.length ? game.availableModes : game.supportedModes,
  );

  return {
    ...game,
    supportedModes: mappedModes,
    availableModes: mappedModes,
    developmentStatus: resolveDevelopmentStatus(game, mappedModes),
  };
};

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
