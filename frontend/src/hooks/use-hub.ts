import { useQuery, useQueries } from "@tanstack/react-query";
import {
  HUB_ID,
  callReadOnly,
  scValToNative,
  u32ToScVal,
} from "@/lib/soroban";

export function useTotalSessions() {
  return useQuery<number>({
    queryKey: ["hub", "totalSessions"],
    queryFn: async () => {
      const val = await callReadOnly(HUB_ID, "get_total_sessions");
      if (!val) return 0;
      return Number(scValToNative(val));
    },
    refetchInterval: 10000,
  });
}

export interface HubSession {
  game_id: string;
  session_id: number;
  player1: string;
  player2: string;
  player1_points: bigint;
  player2_points: bigint;
  status: "Active" | "Finished" | "TimedOut";
  player1_won: boolean;
  result: number;
}

function parseSessionStatus(status: any): "Active" | "Finished" | "TimedOut" {
  if (typeof status === "string") return status as "Active" | "Finished" | "TimedOut";
  if (Array.isArray(status)) return status[0] as "Active" | "Finished" | "TimedOut";
  return "Active";
}

export function useSessions(total: number) {
  return useQueries({
    queries: Array.from({ length: total }, (_, i) => ({
      queryKey: ["hub", "session", i + 1],
      queryFn: async (): Promise<HubSession | null> => {
        const val = await callReadOnly(HUB_ID, "get_session", u32ToScVal(i + 1));
        if (!val || val.switch().name === "scvVoid") return null;
        const native = scValToNative(val);
        if (!native) return null;
        return {
          game_id: native.game_id,
          session_id: Number(native.session_id),
          player1: native.player1,
          player2: native.player2,
          player1_points: BigInt(native.player1_points),
          player2_points: BigInt(native.player2_points),
          status: parseSessionStatus(native.status),
          player1_won: native.player1_won,
          result: Number(native.result ?? 37),
        };
      },
    })),
  });
}

export function useSession(sessionId: number | null) {
  return useQuery<HubSession | null>({
    queryKey: ["hub", "session", sessionId],
    queryFn: async () => {
      if (sessionId === null) return null;
      const val = await callReadOnly(HUB_ID, "get_session", u32ToScVal(sessionId));
      if (!val || val.switch().name === "scvVoid") return null;
      const native = scValToNative(val);
      if (!native) return null;
      return {
        game_id: native.game_id,
        session_id: Number(native.session_id),
        player1: native.player1,
        player2: native.player2,
        player1_points: BigInt(native.player1_points),
        player2_points: BigInt(native.player2_points),
        status: parseSessionStatus(native.status),
        player1_won: native.player1_won,
        result: Number(native.result ?? 37),
      };
    },
    enabled: sessionId !== null,
    refetchInterval: 10000,
  });
}
