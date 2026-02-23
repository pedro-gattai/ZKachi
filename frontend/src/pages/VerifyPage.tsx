import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNumberColor } from "@/components/app/roulette/constants";
import { useCurrentRound, useCurrentBet, useRoundCounter } from "@/hooks/use-roulette";
import { useTotalSessions, useSessions } from "@/hooks/use-hub";
import { stroopsToXlm, stellarExpertUrl } from "@/lib/soroban";
import { useToast } from "@/hooks/use-toast";

const colorMap: Record<string, string> = {
  green: "bg-zkachi-green",
  red: "bg-red-500",
  black: "bg-zinc-800 border border-zinc-600",
};

const VerifyPage = () => {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  // Real contract data
  const { data: currentRound } = useCurrentRound();
  const { data: currentBet } = useCurrentBet();
  const { data: roundCounter = 0 } = useRoundCounter();
  const { data: totalSessions = 0 } = useTotalSessions();
  const sessionQueries = useSessions(totalSessions);

  // Build history from hub sessions (exclude current round)
  const history = useMemo(() => {
    return sessionQueries
      .map((q) => q.data)
      .filter((s): s is NonNullable<typeof s> => s != null)
      .filter((s) => s.session_id !== roundCounter && s.status !== "Active")
      .sort((a, b) => b.session_id - a.session_id);
  }, [sessionQueries, roundCounter]);

  // Compute verification rate from real data
  const verificationRate = useMemo(() => {
    const verified = history.filter((s) => s.status === "Finished").length;
    const totalFinished = history.filter((s) => s.status !== "Active").length;
    return totalFinished > 0 ? Math.round((verified / totalFinished) * 100) : 100;
  }, [history]);

  // Build display rows from current round
  const rounds = useMemo(() => {
    if (!currentRound) return [];

    const entry = {
      roundNumber: currentRound.id,
      result: currentRound.result,
      status: currentRound.status,
      cranker: truncAddr(currentRound.cranker),
      commitHash: currentRound.commit,
      betType: currentBet ? parseBetTypeLabel(currentBet.bet_type) : "—",
      amount: currentBet ? stroopsToXlm(currentBet.amount) : 0,
      seedPlayer: currentBet?.seed_player || "",
      isSettled: currentRound.status === "Settled",
      isTimedOut: currentRound.status === "TimedOut",
    };

    return [entry];
  }, [currentRound, currentBet]);

  const statusLabel = (status: string) => {
    switch (status) {
      case "Settled": return { text: "Verified", class: "bg-zkachi-green/10 text-zkachi-green" };
      case "TimedOut": return { text: "Timed Out", class: "bg-destructive/10 text-destructive" };
      case "Open": return { text: "Open", class: "bg-zkachi-gold/10 text-zkachi-gold" };
      case "BetPlaced": return { text: "Revealing", class: "bg-primary/10 text-primary" };
      default: return { text: status, class: "bg-muted/50 text-muted-foreground" };
    }
  };

  return (
    <div className="max-w-[960px] mx-auto py-6 px-4 space-y-5">
      {/* Section A — Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          Proof Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View the current round and verify ZK proofs on-chain.
        </p>
      </div>

      {/* Section B — Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Rounds", value: String(roundCounter) },
          { label: "Hub Sessions", value: String(totalSessions) },
          { label: "Verification Rate", value: `${verificationRate}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-2xl p-4 text-center"
          >
            <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-1">
              {stat.label}
            </span>
            <span className="block font-extrabold text-[20px] leading-tight text-foreground">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Section C — Current Round */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
          Current Round
        </span>

        {rounds.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-space text-xs uppercase tracking-wider text-muted-foreground">
                Waiting for round...
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              No active round. The cranker will open one soon.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[60px_56px_1fr_80px_80px_80px_90px] gap-3 items-center mb-2 pb-2 border-b border-border">
              {["Round", "Result", "Bet", "Amount", "Cranker", "Status", "Action"].map(
                (h) => (
                  <span
                    key={h}
                    className={`font-space text-[8px] tracking-[1.5px] uppercase text-muted-foreground/60 ${
                      h === "Amount" || h === "Status" || h === "Action"
                        ? "text-right"
                        : ""
                    }`}
                  >
                    {h}
                  </span>
                )
              )}
            </div>

            {rounds.map((round) => {
              const color = round.isSettled ? getNumberColor(round.result) : "green";
              const isExpanded = expandedRound === round.roundNumber;
              const badge = statusLabel(round.status);

              return (
                <div key={round.roundNumber}>
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[60px_56px_1fr_80px_80px_80px_90px] gap-3 items-center py-2.5 border-b border-border/50">
                    <span className="font-space text-[12px] font-bold text-foreground">
                      #{round.roundNumber}
                    </span>

                    <div className="flex items-center gap-2">
                      {round.isSettled ? (
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-white ${colorMap[color]}`}
                        >
                          {round.result}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-muted-foreground border border-border">
                          ?
                        </span>
                      )}
                    </div>

                    <span className="font-space text-[11px] text-muted-foreground truncate">
                      {round.betType}
                    </span>

                    <span className="font-space text-[11px] font-bold text-foreground text-right">
                      {round.amount > 0 ? `${Math.floor(round.amount)} XLM` : "—"}
                    </span>

                    <span className="font-space text-[10px] text-muted-foreground text-right">
                      {round.cranker}
                    </span>

                    <span className="inline-flex items-center justify-end">
                      <span className={`font-space text-[9px] font-bold tracking-wide rounded-md px-2 py-1 ${badge.class}`}>
                        {badge.text}
                      </span>
                    </span>

                    <button
                      onClick={() =>
                        setExpandedRound(isExpanded ? null : round.roundNumber)
                      }
                      className="font-space text-[9px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors text-right"
                    >
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                  </div>

                  {/* Mobile card */}
                  <div className="sm:hidden border-b border-border/50 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-space text-[12px] font-bold text-foreground">
                          #{round.roundNumber}
                        </span>
                        {round.isSettled ? (
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-white ${colorMap[color]}`}
                          >
                            {round.result}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-muted-foreground border border-border">
                            ?
                          </span>
                        )}
                        <span className="font-space text-[11px] text-muted-foreground">
                          {round.betType}
                        </span>
                      </div>
                      <span className={`font-space text-[9px] font-bold tracking-wide rounded-md px-2 py-1 ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-space text-[11px] font-bold text-foreground">
                        {round.amount > 0 ? `${Math.floor(round.amount)} XLM` : "—"}
                      </span>
                      <button
                        onClick={() =>
                          setExpandedRound(isExpanded ? null : round.roundNumber)
                        }
                        className="font-space text-[9px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors"
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-background border border-border/50 rounded-xl p-4 my-2 space-y-3">
                          {[
                            { label: "Commit Hash", value: `0x${round.commitHash}` },
                            { label: "Cranker", value: currentRound?.cranker || "—" },
                            ...(round.seedPlayer ? [{ label: "Player Seed", value: `0x${round.seedPlayer}` }] : []),
                          ].map((item) => (
                            <div key={item.label}>
                              <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-0.5">
                                {item.label}
                              </span>
                              <span className="block font-mono text-[11px] text-foreground/80 break-all">
                                {item.value.length > 48 ? item.value.slice(0, 48) + "..." : item.value}
                              </span>
                            </div>
                          ))}

                          <div className="flex items-center gap-2 pt-1">
                            {round.isSettled ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-zkachi-green" />
                                <span className="font-space text-[10px] font-bold text-zkachi-green tracking-wide">
                                  On-chain Verified
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-zkachi-gold animate-pulse" />
                                <span className="font-space text-[10px] font-bold text-zkachi-gold tracking-wide">
                                  {round.status}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section D — Round History */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
            Round History
          </span>

          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-[60px_56px_1fr_100px_100px_100px_70px] gap-3 items-center mb-2 pb-2 border-b border-border">
            {["Round", "Result", "Cranker", "Bet", "Status", "Outcome", ""].map((h) => (
              <span
                key={h}
                className={`font-space text-[8px] tracking-[1.5px] uppercase text-muted-foreground/60 ${
                  h === "Bet" || h === "Status" || h === "Outcome" ? "text-right" : ""
                }`}
              >
                {h}
              </span>
            ))}
          </div>

          <div className="space-y-0">
            {history.map((session) => {
              const isResolved = session.status === "Finished" || session.status === "TimedOut";
              const badge = session.status === "Finished"
                ? { text: "Verified", class: "bg-zkachi-green/10 text-zkachi-green" }
                : session.status === "TimedOut"
                  ? { text: "Timed Out", class: "bg-destructive/10 text-destructive" }
                  : { text: "Active", class: "bg-zkachi-gold/10 text-zkachi-gold" };
              const outcome = isResolved
                ? session.player1_won
                  ? { text: "Player Won", class: "text-zkachi-green" }
                  : { text: "House Won", class: "text-red-400" }
                : { text: "—", class: "text-muted-foreground" };
              const betAmount = stroopsToXlm(session.player2_points);

              const resultColor = session.result <= 36 ? getNumberColor(session.result) : "green";

              return (
                <div key={session.session_id}>
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[60px_56px_1fr_100px_100px_100px_70px] gap-3 items-center py-2.5 border-b border-border/50">
                    <span className="font-space text-[12px] font-bold text-foreground">
                      #{session.session_id}
                    </span>
                    <div className="flex items-center">
                      {session.result <= 36 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-white ${colorMap[resultColor]}`}>
                          {session.result}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-muted-foreground border border-border">
                          ?
                        </span>
                      )}
                    </div>
                    <span className="font-space text-[10px] text-muted-foreground truncate">
                      {truncAddr(session.player1)}
                    </span>
                    <span className="font-space text-[11px] font-bold text-foreground text-right">
                      {Math.floor(betAmount)} XLM
                    </span>
                    <span className="inline-flex items-center justify-end">
                      <span className={`font-space text-[9px] font-bold tracking-wide rounded-md px-2 py-1 ${badge.class}`}>
                        {badge.text}
                      </span>
                    </span>
                    <span className={`font-space text-[10px] font-bold text-right ${outcome.class}`}>
                      {outcome.text}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedHistory(expandedHistory === session.session_id ? null : session.session_id)
                      }
                      className="font-space text-[9px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors text-right"
                    >
                      {expandedHistory === session.session_id ? "Hide" : "Details"}
                    </button>
                  </div>

                  {/* Mobile card */}
                  <div className="sm:hidden border-b border-border/50 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-space text-[12px] font-bold text-foreground">
                          #{session.session_id}
                        </span>
                        {session.result <= 36 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ${colorMap[resultColor]}`}>
                            {session.result}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-muted-foreground border border-border">
                            ?
                          </span>
                        )}
                        <span className="font-space text-[10px] text-muted-foreground">
                          {truncAddr(session.player1)}
                        </span>
                      </div>
                      <span className={`font-space text-[9px] font-bold tracking-wide rounded-md px-2 py-1 ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-space text-[11px] font-bold text-foreground">
                        {Math.floor(betAmount)} XLM
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={`font-space text-[10px] font-bold ${outcome.class}`}>
                          {outcome.text}
                        </span>
                        <button
                          onClick={() =>
                            setExpandedHistory(expandedHistory === session.session_id ? null : session.session_id)
                          }
                          className="font-space text-[9px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors"
                        >
                          {expandedHistory === session.session_id ? "Hide" : "Details"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  <AnimatePresence>
                    {expandedHistory === session.session_id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-background border border-border/50 rounded-xl p-4 my-2 space-y-3">
                          <div>
                            <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-0.5">
                              Cranker
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-foreground/80 break-all">
                                {session.player1}
                              </span>
                              <button
                                onClick={() => copyToClipboard(session.player1, "Cranker address")}
                                className="shrink-0 font-space text-[8px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors"
                              >
                                Copy
                              </button>
                              <a
                                href={stellarExpertUrl("account", session.player1)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 font-space text-[8px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors"
                              >
                                Explorer
                              </a>
                            </div>
                          </div>

                          <div>
                            <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-0.5">
                              Roulette Contract
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-foreground/80 break-all">
                                {session.game_id}
                              </span>
                              <button
                                onClick={() => copyToClipboard(session.game_id, "Contract address")}
                                className="shrink-0 font-space text-[8px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors"
                              >
                                Copy
                              </button>
                              <a
                                href={stellarExpertUrl("contract", session.game_id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 font-space text-[8px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors"
                              >
                                Explorer
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {session.status === "Finished" ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-zkachi-green" />
                                <span className="font-space text-[10px] font-bold text-zkachi-green tracking-wide">
                                  ZK Proof Verified On-Chain
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-destructive" />
                                <span className="font-space text-[10px] font-bold text-destructive tracking-wide">
                                  Timed Out — No Proof Submitted
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function truncAddr(s: string): string {
  if (s.length <= 12) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function parseBetTypeLabel(betTypeJson: string): string {
  try {
    const parsed = JSON.parse(betTypeJson);
    // Soroban enums come as various shapes via scValToNative
    if (typeof parsed === "string") return parsed;
    if (Array.isArray(parsed)) {
      const [variant, arg] = parsed;
      if (variant === "Straight") return `Straight ${arg}`;
      if (variant === "Dozen") return `Dozen ${arg}`;
      return variant;
    }
    // Object form: { Straight: 17 } or { Red: [] }
    const keys = Object.keys(parsed);
    if (keys.length === 1) {
      const key = keys[0];
      const val = parsed[key];
      if (typeof val === "number") return `${key} ${val}`;
      return key;
    }
    return JSON.stringify(parsed);
  } catch {
    return betTypeJson;
  }
}

export default VerifyPage;
