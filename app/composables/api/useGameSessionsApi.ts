import { useApiClient } from "../useApiClient";

export type GameLevel = "easy" | "medium" | "hard";
export type SessionResult = "win" | "lose";

export interface StartGameSessionResponse {
  session: {
    sessionId: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    context?: {
      selectedLevel?: GameLevel;
      entryCostCoins?: number;
      resultSubmitted?: boolean;
    };
    score?: number | null;
  };
  userGameId: string;
  coins: number;
}

export interface FinishGameSessionResponse {
  userGame?: {
    id: string;
    result: SessionResult;
    selectedLevel: GameLevel;
    entryCostCoins: number;
    rewardOrPenaltyCoins: number;
    coins: number;
    createdAt: string;
  };
  coins: number;
}

export const useGameSessionsApi = () => {
  const { apiFetch } = useApiClient();

  return {
    startGameSession(gameId: string, level: GameLevel) {
      return apiFetch<StartGameSessionResponse>(
        `/api/v1/games/${encodeURIComponent(gameId)}/sessions/start`,
        {
          method: "POST",
          body: { level },
        },
      );
    },
    finishGameSession(sessionId: string, result: SessionResult) {
      return apiFetch<FinishGameSessionResponse>(
        `/api/v1/games/sessions/${encodeURIComponent(sessionId)}/finish`,
        {
          method: "POST",
          body: { result },
        },
      );
    },
  };
};
