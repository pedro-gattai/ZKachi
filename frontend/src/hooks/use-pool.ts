import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import * as StellarSdk from "@stellar/stellar-sdk";
import {
  POOL_ID,
  callReadOnly,
  scValToNative,
  addressToScVal,
  i128ToScVal,
  xlmToStroops,
  stroopsToXlm,
  getContract,
  buildTx,
  prepareAndSubmit,
  getServer,
} from "@/lib/soroban";

// --- Queries ---

export function usePoolBalance() {
  return useQuery<bigint>({
    queryKey: ["pool", "balance"],
    queryFn: async () => {
      const val = await callReadOnly(POOL_ID, "get_pool_balance");
      if (!val) return 0n;
      return BigInt(scValToNative(val));
    },
    refetchInterval: 10000,
  });
}

export function useTotalShares() {
  return useQuery<bigint>({
    queryKey: ["pool", "totalShares"],
    queryFn: async () => {
      const val = await callReadOnly(POOL_ID, "get_total_shares");
      if (!val) return 0n;
      return BigInt(scValToNative(val));
    },
    refetchInterval: 10000,
  });
}

export function useSharePrice() {
  return useQuery<bigint>({
    queryKey: ["pool", "sharePrice"],
    queryFn: async () => {
      const val = await callReadOnly(POOL_ID, "get_share_price");
      if (!val) return 0n;
      return BigInt(scValToNative(val));
    },
    refetchInterval: 10000,
  });
}

export function useMaxBet() {
  return useQuery<bigint>({
    queryKey: ["pool", "maxBet"],
    queryFn: async () => {
      const val = await callReadOnly(POOL_ID, "get_max_bet");
      if (!val) return 0n;
      return BigInt(scValToNative(val));
    },
    refetchInterval: 10000,
  });
}

export function useLpShares(publicKey: string | null) {
  return useQuery<bigint>({
    queryKey: ["pool", "lpShares", publicKey],
    queryFn: async () => {
      if (!publicKey) return 0n;
      const val = await callReadOnly(POOL_ID, "get_lp_shares", addressToScVal(publicKey));
      if (!val) return 0n;
      return BigInt(scValToNative(val));
    },
    enabled: !!publicKey,
    refetchInterval: 10000,
  });
}

export function useXlmBalance(publicKey: string | null) {
  return useQuery<number>({
    queryKey: ["xlm", "balance", publicKey],
    queryFn: async () => {
      if (!publicKey) return 0;
      const server = getServer();
      try {
        const result = await server.getSACBalance(
          publicKey,
          StellarSdk.Asset.native(),
          StellarSdk.Networks.TESTNET,
        );
        return result ? Number(result.balanceEntry.amount) / 10_000_000 : 0;
      } catch {
        return 0;
      }
    },
    enabled: !!publicKey,
    refetchInterval: 10000,
  });
}

// --- Derived helpers ---

export function usePoolDisplayData() {
  const { data: poolBalance = 0n } = usePoolBalance();
  const { data: totalShares = 0n } = useTotalShares();
  const { data: sharePrice = 0n } = useSharePrice();
  const { data: maxBet = 0n } = useMaxBet();

  return {
    poolBalanceXlm: stroopsToXlm(poolBalance),
    totalShares,
    sharePriceXlm: Number(sharePrice) / 10_000_000,
    maxBetXlm: stroopsToXlm(maxBet),
  };
}

// --- Mutations ---

export function useDeposit() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amountXlm }: { amountXlm: number }) => {
      if (!publicKey) throw new Error("Wallet not connected");

      const contract = getContract(POOL_ID);
      const amountStroops = xlmToStroops(amountXlm);

      const op = contract.call(
        "deposit",
        addressToScVal(publicKey),
        i128ToScVal(amountStroops),
      );

      const tx = await buildTx(publicKey, op);
      return await prepareAndSubmit(tx, publicKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool"] });
      queryClient.invalidateQueries({ queryKey: ["xlm"] });
    },
  });
}

export function useWithdraw() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shares }: { shares: bigint }) => {
      if (!publicKey) throw new Error("Wallet not connected");

      const contract = getContract(POOL_ID);

      const op = contract.call(
        "withdraw",
        addressToScVal(publicKey),
        i128ToScVal(shares),
      );

      const tx = await buildTx(publicKey, op);
      return await prepareAndSubmit(tx, publicKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool"] });
      queryClient.invalidateQueries({ queryKey: ["xlm"] });
    },
  });
}
