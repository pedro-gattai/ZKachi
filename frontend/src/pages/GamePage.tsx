import { useState, useCallback, useEffect, useMemo } from "react";
import BettingBoard from "@/components/app/roulette/BettingBoard";
import BetControls from "@/components/app/roulette/BetControls";
import GameStatusPanel from "@/components/app/roulette/GameStatusPanel";
import {
  type BetType,
  type GamePhase,
  type RoundResult,
  evaluateBet,
  betLabel,
} from "@/components/app/roulette/constants";
import { useWallet } from "@/hooks/use-wallet";
import { useCurrentRound, useCurrentBet, usePlaceBet, useClaimTimeout, useLatestLedger, useRoundCounter } from "@/hooks/use-roulette";
import { useMaxBet } from "@/hooks/use-pool";
import { useTotalSessions, useSessions } from "@/hooks/use-hub";
import { stroopsToXlm } from "@/lib/soroban";

const GamePage = () => {
  const { connected, connecting, connect, publicKey } = useWallet();
  const { data: round, isLoading: roundLoading } = useCurrentRound();
  const { data: bet } = useCurrentBet();
  const placeBetMutation = usePlaceBet();
  const claimTimeoutMutation = useClaimTimeout();
  const { data: latestLedger } = useLatestLedger();
  const { data: maxBetStroops } = useMaxBet();

  const { data: roundCounter = 0 } = useRoundCounter();
  const { data: totalSessions = 0 } = useTotalSessions();
  const sessionQueries = useSessions(totalSessions);

  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [amount, setAmount] = useState(50);
  const [history, setHistory] = useState<RoundResult[]>([]);
  // Track previous round to detect settlement
  const [lastSettledId, setLastSettledId] = useState<number | null>(null);
  // Track if we placed a bet this round (to know if result is ours)
  const [placedBetThisRound, setPlacedBetThisRound] = useState(false);

  const maxBetXlm = maxBetStroops ? stroopsToXlm(maxBetStroops) : 0;

  // Derive game phase from contract state
  const phase: GamePhase = useMemo(() => {
    if (!round) return "WAITING";
    switch (round.status) {
      case "Open":
        return "OPEN";
      case "BetPlaced":
        return "REVEALING";
      case "Settled":
      case "TimedOut":
        if (placedBetThisRound) return "SETTLED";
        return "WAITING";
      default:
        return "WAITING";
    }
  }, [round, placedBetThisRound]);

  const roundNumber = round?.id ?? 0;

  // Result from settled round
  const result = phase === "SETTLED" && round ? round.result : null;

  // Evaluate win/loss when settled
  const settlement = useMemo(() => {
    if (result === null || !selectedBet) return { won: null, payout: 0, multiplier: 0 };
    const ev = evaluateBet(selectedBet, result);
    return {
      won: ev.won,
      payout: ev.won ? amount * ev.multiplier : 0,
      multiplier: ev.multiplier,
    };
  }, [result, selectedBet, amount]);

  // When round settles and we had a bet, add to history
  useEffect(() => {
    if (
      round?.status === "Settled" &&
      placedBetThisRound &&
      round.id !== lastSettledId &&
      selectedBet
    ) {
      const ev = evaluateBet(selectedBet, round.result);
      setHistory((prev) => [
        {
          roundNumber: round.id,
          result: round.result,
          won: ev.won,
          amount: ev.won ? amount * ev.multiplier : amount,
          betLabel: betLabel(selectedBet),
        },
        ...prev.slice(0, 9),
      ]);
      setLastSettledId(round.id);
    }
  }, [round, placedBetThisRound, lastSettledId, selectedBet, amount]);

  const handlePlaceBet = useCallback(async () => {
    if (!selectedBet || phase !== "OPEN") return;
    try {
      await placeBetMutation.mutateAsync({ betType: selectedBet, amountXlm: amount });
      setPlacedBetThisRound(true);
    } catch (err: any) {
      console.error("Place bet failed:", err);
    }
  }, [selectedBet, amount, phase, placeBetMutation]);

  const handleNewRound = useCallback(() => {
    setSelectedBet(null);
    setPlacedBetThisRound(false);
  }, []);

  // Timeout claim logic
  const TIMEOUT_LEDGERS = 100;
  const ledgersRemaining = round?.status === "BetPlaced" && latestLedger
    ? Math.max(0, round.commit_ledger + TIMEOUT_LEDGERS - latestLedger)
    : undefined;
  const canClaimTimeout = ledgersRemaining === 0;

  const handleClaimTimeout = useCallback(async () => {
    try {
      await claimTimeoutMutation.mutateAsync();
      setPlacedBetThisRound(false);
      setSelectedBet(null);
    } catch (err: any) {
      console.error("Claim timeout failed:", err);
    }
  }, [claimTimeoutMutation]);

  // Build recent rounds from blockchain hub sessions
  const recentRounds = useMemo(() => {
    return sessionQueries
      .map((q) => q.data)
      .filter((s): s is NonNullable<typeof s> => s != null)
      .filter((s) => s.session_id !== roundCounter && s.status !== "Active")
      .sort((a, b) => b.session_id - a.session_id)
      .slice(0, 10)
      .map((s) => ({
        roundNumber: s.session_id,
        result: s.result,
        status: s.status as "Finished" | "TimedOut",
        playerWon: s.player1_won,
        betAmount: stroopsToXlm(s.player2_points),
      }));
  }, [sessionQueries, roundCounter]);

  const isBettingDisabled = phase !== "OPEN" || placeBetMutation.isPending;
  const placedLabel = placeBetMutation.isPending
    ? "Submitting..."
    : phase === "REVEALING"
    ? "Waiting for reveal..."
    : phase === "SETTLED"
    ? "Round Over"
    : undefined;

  if (!connected) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="border border-dashed border-border rounded-2xl p-10 text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-zkachi-gold/10 border border-zkachi-gold/20 flex items-center justify-center mx-auto mb-4">
            <span className="font-space font-bold text-zkachi-gold text-sm">ZK</span>
          </div>
          <h2 className="font-outfit font-bold text-lg text-foreground mb-2">Connect to Play</h2>
          <p className="font-space text-[11px] text-muted-foreground mb-6">
            Connect your Stellar wallet to place bets and play ZKachi roulette on testnet.
          </p>
          <button
            onClick={connect}
            disabled={connecting}
            className="font-space text-[10px] tracking-[1.5px] uppercase bg-zkachi-gold/10 text-zkachi-gold border border-zkachi-gold/20 px-5 py-2.5 rounded-lg hover:bg-zkachi-gold/15 transition-colors disabled:opacity-50"
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 py-6">
      {/* Left — Betting Board (3/5 = 60%) */}
      <div className="lg:col-span-3">
        <BettingBoard
          selectedBet={selectedBet}
          onSelectBet={setSelectedBet}
          disabled={isBettingDisabled}
        />
        <BetControls
          selectedBet={selectedBet}
          amount={amount}
          onAmountChange={setAmount}
          onPlaceBet={handlePlaceBet}
          disabled={isBettingDisabled}
          placedLabel={placedLabel}
          maxBet={maxBetXlm}
        />
        {placeBetMutation.isError && (
          <div className="mt-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="font-space text-[11px] text-destructive">
              {(placeBetMutation.error as Error)?.message || "Transaction failed"}
            </p>
          </div>
        )}
      </div>

      {/* Right — Game Status (2/5 = 40%) */}
      <div className="lg:col-span-2">
        <GameStatusPanel
          phase={phase}
          roundNumber={roundNumber}
          currentBet={selectedBet}
          betAmount={amount}
          result={result}
          won={settlement.won}
          payout={settlement.payout}
          multiplier={settlement.multiplier}
          history={history}
          onNewRound={handleNewRound}
          crankerAddress={round?.cranker}
          commitHash={round?.commit}
          onClaimTimeout={handleClaimTimeout}
          claimTimeoutPending={claimTimeoutMutation.isPending}
          canClaimTimeout={canClaimTimeout}
          ledgersRemaining={ledgersRemaining}
          recentRounds={recentRounds}
        />
      </div>
    </div>
  );
};

export default GamePage;
