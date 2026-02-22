import { motion, AnimatePresence } from "framer-motion";
import { type GamePhase, type BetType, type RoundResult, getNumberColor, betLabel } from "./constants";

interface Props {
  phase: GamePhase;
  roundNumber: number;
  currentBet: BetType | null;
  betAmount: number;
  result: number | null;
  won: boolean | null;
  payout: number;
  multiplier: number;
  history: RoundResult[];
  onNewRound: () => void;
  crankerAddress?: string;
  commitHash?: string;
  onClaimTimeout?: () => void;
  claimTimeoutPending?: boolean;
  canClaimTimeout?: boolean;
  ledgersRemaining?: number;
  recentRounds?: { roundNumber: number; result: number; status: "Finished" | "TimedOut"; playerWon: boolean; betAmount: number }[];
}

const colorClasses: Record<string, string> = {
  red: "bg-zkachi-red/80",
  black: "bg-border",
  green: "bg-zkachi-green/80",
};

const truncAddr = (s?: string) => s ? `${s.slice(0, 4)}...${s.slice(-4)}` : "—";
const truncHash = (s?: string) => s ? `0x${s.slice(0, 6)}...${s.slice(-4)}` : "—";

const GameStatusPanel = ({ phase, roundNumber, currentBet, betAmount, result, won, payout, multiplier, history, onNewRound, crankerAddress, commitHash, onClaimTimeout, claimTimeoutPending, canClaimTimeout, ledgersRemaining, recentRounds = [] }: Props) => {
  return (
    <div className="space-y-4">
      {/* Round status card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
          Round Status
        </span>

        <AnimatePresence mode="wait">
          {phase === "WAITING" && (
            <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center py-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-space text-xs uppercase tracking-wider text-muted-foreground">Waiting for Cranker...</span>
              </div>
              <p className="text-xs text-muted-foreground/60">A cranker will open the next round soon</p>
            </motion.div>
          )}

          {phase === "OPEN" && (
            <motion.div key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-zkachi-green animate-pulse-green" />
                <span className="font-bold text-sm text-foreground">Round #{roundNumber} — Open</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-space text-[10px] text-muted-foreground uppercase">Cranker</span>
                  <span className="font-space text-[10px] text-foreground">{truncAddr(crankerAddress)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-space text-[10px] text-muted-foreground uppercase">Commit</span>
                  <span className="font-space text-[10px] text-foreground">{truncHash(commitHash)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {phase === "REVEALING" && (
            <motion.div key="revealing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center py-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <motion.div
                  className="w-5 h-5 border-2 border-zkachi-gold border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <span className="font-bold text-sm text-foreground">Verifying ZK Proof...</span>
              </div>
              {currentBet && (
                <p className="text-xs text-muted-foreground mb-4">
                  Your Bet: {betAmount} XLM on {betLabel(currentBet)}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 text-[10px] font-space text-muted-foreground/60">
                <span className="text-zkachi-gold">Generating proof...</span>
                <span>→</span>
                <span>Submitting...</span>
                <span>→</span>
                <span>Verifying on-chain...</span>
              </div>

              {/* Timeout claim */}
              {ledgersRemaining !== undefined && (
                <div className="mt-5 pt-4 border-t border-border">
                  {canClaimTimeout ? (
                    <>
                      <p className="font-space text-[10px] text-destructive mb-3">
                        Cranker timed out. You can reclaim your bet + bond.
                      </p>
                      <button
                        onClick={onClaimTimeout}
                        disabled={claimTimeoutPending}
                        className="w-full font-space font-bold text-[10px] tracking-[1.5px] uppercase px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        {claimTimeoutPending ? "Claiming..." : "Claim Timeout"}
                      </button>
                    </>
                  ) : (
                    <p className="font-space text-[10px] text-muted-foreground/60 text-center">
                      Timeout in ~{ledgersRemaining} ledgers (~{Math.ceil(ledgersRemaining * 5 / 60)} min)
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {phase === "SETTLED" && result !== null && (
            <motion.div key="settled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
              {/* Result circle */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`w-[100px] h-[100px] rounded-full mx-auto flex items-center justify-center mb-4 ${colorClasses[getNumberColor(result)]}`}
              >
                <span className="font-extrabold text-[36px] text-foreground">{result}</span>
              </motion.div>

              {/* Win/Lose */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                {won ? (
                  <p className="text-lg font-bold text-zkachi-green mb-1">
                    YOU WON! +{payout.toLocaleString()} XLM
                  </p>
                ) : (
                  <p className="text-lg font-bold text-destructive mb-1">
                    YOU LOST — {betAmount} XLM
                  </p>
                )}
                <span className="font-space text-[10px] text-muted-foreground">{multiplier}x multiplier</span>
              </motion.div>

              {/* ZK badge */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 mb-5">
                <span className="inline-flex items-center gap-1.5 bg-zkachi-green/10 text-zkachi-green font-space text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border border-zkachi-green/20">
                  ZK Proof Verified ✓
                </span>
              </motion.div>

              <button
                onClick={onNewRound}
                className="w-full font-space font-bold text-[10px] tracking-[1.5px] uppercase px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 transition-all shadow-lg shadow-zkachi-gold/20"
              >
                New Round
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Your rounds (current session) */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-3">
            Your Rounds
          </span>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {history.map((r) => {
              const color = getNumberColor(r.result);
              return (
                <div key={r.roundNumber} className="flex items-center justify-between text-xs">
                  <span className="font-space text-[10px] text-muted-foreground">#{r.roundNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-foreground ${colorClasses[color]}`}>
                      {r.result}
                    </span>
                    <span className="font-space text-[10px] text-muted-foreground">{r.betLabel}</span>
                  </div>
                  <span className={`font-space text-[10px] font-bold ${r.won ? "text-zkachi-green" : "text-destructive"}`}>
                    {r.won ? `+${r.amount}` : `-${r.amount}`} XLM
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Round history from blockchain */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-3">
          Round History
        </span>

        {recentRounds.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-3">No rounds yet</p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {recentRounds.map((r) => {
              const ballColor = r.result <= 36 ? getNumberColor(r.result) : "green";
              return (
                <div key={r.roundNumber} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-space text-[10px] text-muted-foreground">#{r.roundNumber}</span>
                    {r.result <= 36 ? (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-foreground ${colorClasses[ballColor]}`}>
                        {r.result}
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-muted-foreground border border-border">
                        ?
                      </span>
                    )}
                  </div>
                  <span className={`font-space text-[9px] font-bold tracking-wide rounded-md px-2 py-0.5 ${
                    r.status === "Finished"
                      ? "bg-zkachi-green/10 text-zkachi-green"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {r.status === "Finished" ? "Verified" : "Timed Out"}
                  </span>
                  <span className="font-space text-[10px] text-muted-foreground">
                    {Math.floor(r.betAmount)} XLM
                  </span>
                  <span className={`font-space text-[10px] font-bold ${r.playerWon ? "text-zkachi-green" : "text-red-400"}`}>
                    {r.playerWon ? "Player Won" : "House Won"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStatusPanel;
