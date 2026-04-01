import { useApiClient } from "../useApiClient";

export interface ApiGameListItem {
  id: string;
  key?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

type GamesResponse = ApiGameListItem[] | { items?: ApiGameListItem[] };

export const useGamesApi = () => {
  const { apiFetch } = useApiClient();

  return {
    getGames() {
      return apiFetch<GamesResponse>("/api/v1/games", {
        method: "GET",
      });
    },
  };
};
