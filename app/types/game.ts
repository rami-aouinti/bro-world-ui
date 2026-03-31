export type PlayMode = "ai" | "pvp";
export type BeloteMode = "teams" | "free-for-all";

export interface GameEntry {
  id: string;
  categoryKey?: string;
  subcategoryKey?: string;
  difficultyKey?: string;
  tags?: string[];
  features?: string[];
  nameKey: string;
  descriptionKey: string;
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
  nameKey: string;
  descriptionKey: string;
  img: string;
  icon: string;
  games: GameEntry[];
}

export interface GameCategory {
  id: string;
  nameKey: string;
  descriptionKey: string;
  img: string;
  icon: string;
  subCategories: GameSubCategory[];
}
