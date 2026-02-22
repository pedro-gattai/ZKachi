import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import {
  ROULETTE_ID,
  callReadOnly,
  parseRound,
  parseBet,
  betTypeToScVal,
  addressToScVal,
  i128ToScVal,
  bytesN32ToScVal,
  randomSeed,
  xlmToStroops,
  getContract,
  buildTx,
  prepareAndSubmit,
  getLatestLedger,
  type ContractRound,
  type ContractBet,
} from "@/lib/soroban";
import type { BetType } from "@/components/app/roulette/constants";

// --- Queries ---

export function useCurrentRound() {
  return useQuery<ContractRound | null>({
    queryKey: ["roulette", "currentRound"],
    queryFn: async () => {
      const val = await callReadOnly(ROULETTE_ID, "get_current_round");
      return parseRound(val);
    },
    refetchInterval: 3000,
  });
}

export function useCurrentBet() {
  return useQuery<ContractBet | null>({
    queryKey: ["roulette", "currentBet"],
    queryFn: async () => {
      const val = await callReadOnly(ROULETTE_ID, "get_current_bet");
      return parseBet(val);
    },
    refetchInterval: 3000,
  });
}

export function useRoundCounter() {
  return useQuery<number>({
    queryKey: ["roulette", "roundCounter"],
    queryFn: async () => {
      const val = await callReadOnly(ROULETTE_ID, "get_round_counter");
      if (!val) return 0;
      return Number(val.value());
    },
    refetchInterval: 10000,
  });
}

export function useLatestLedger() {
  return useQuery<number>({
    queryKey: ["roulette", "latestLedger"],
    queryFn: getLatestLedger,
    refetchInterval: 6000,
  });
}

// --- Mutations ---

export function usePlaceBet() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      betType,
      amountXlm,
    }: {
      betType: BetType;
      amountXlm: number;
    }) => {
      if (!publicKey) throw new Error("Wallet not connected");

      const contract = getContract(ROULETTE_ID);
      const seedPlayer = randomSeed();
      const amountStroops = xlmToStroops(amountXlm);

      const op = contract.call(
        "place_bet",
        addressToScVal(publicKey),
        betTypeToScVal(betType),
        bytesN32ToScVal(seedPlayer),
        i128ToScVal(amountStroops),
      );

      const tx = await buildTx(publicKey, op);
      const result = await prepareAndSubmit(tx, publicKey);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roulette"] });
    },
  });
}

export function useClaimTimeout() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!publicKey) throw new Error("Wallet not connected");

      const contract = getContract(ROULETTE_ID);
      const op = contract.call("claim_timeout", addressToScVal(publicKey));

      const tx = await buildTx(publicKey, op);
      return await prepareAndSubmit(tx, publicKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roulette"] });
    },
  });
}
