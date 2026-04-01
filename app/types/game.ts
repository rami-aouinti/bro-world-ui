export type PlayMode = "ai" | "pvp";
export type ApiPlayMode = "solo" | "versus" | "online" | "endless" | "ai" | "pvp";
export type BeloteMode = "teams" | "free-for-all";

export interface GameEntry {
  id: string;
  key?: string;
  categoryKey?: string;
  subcategoryKey?: string;
  difficultyKey?: string;
  tags?: string[];
  features?: string[];
  nameKey: string;
  descriptionKey: string;
  img: string;
  icon: string;
  component:
    | "rami"
    | "belote"
    | "checkers"
    | "poker"
    | "game2048"
    | "sudoku"
    | "chess"
    | "hidden-word"
    | "nonogram"
    | "uno"
    | null;
  supportedModes: PlayMode[];
}

export interface GameSubCategory {
  id: string;
  key?: string;
  nameKey: string;
  descriptionKey: string;
  img: string;
  icon: string;
  games: GameEntry[];
}

export interface GameCategory {
  id: string;
  key?: string;
  nameKey: string;
  descriptionKey: string;
  img: string;
  icon: string;
  subCategories: GameSubCategory[];
}


export interface ApiGameEntry extends Omit<GameEntry, "supportedModes"> {
  supportedModes: ApiPlayMode[];
}

export interface ApiGameSubCategory extends Omit<GameSubCategory, "games"> {
  games: ApiGameEntry[];
}

export interface ApiGameCategory extends Omit<GameCategory, "subCategories"> {
  subCategories: ApiGameSubCategory[];
}
