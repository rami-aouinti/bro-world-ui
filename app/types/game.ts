export type PlayMode = "ai" | "pvp";
export type BeloteMode = "teams" | "free-for-all";
export type GameDifficulty = "facile" | "moyen" | "difficile";

export interface GameEntry {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  categoryKey?: string;
  subcategoryKey?: string;
  difficulty?: GameDifficulty;
  tags?: string[];
  features?: string[];
  nameKey: string;
  descriptionKey: string;
  icon: string;
  component: "rami" | "belote" | "checkers" | "poker" | "hidden-word" | null;
  supportedModes: PlayMode[];
}

export interface GameSubCategory {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  games: GameEntry[];
}

export interface GameCategory {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  subCategories: GameSubCategory[];
}
