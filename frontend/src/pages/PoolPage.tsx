import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import {
  usePoolDisplayData,
  useLpShares,
  useXlmBalance,
  useDeposit,
  useWithdraw,
} from "@/hooks/use-pool";
import { stroopsToXlm, xlmToStroops } from "@/lib/soroban";

const MIN_DEPOSIT = 10;

const QUICK_DEPOSIT = [100, 500, 1_000, 5_000];
const QUICK_WITHDRAW = [25, 50, 75, 100];

const PoolPage = () => {
  const { toast } = useToast();
  const { connected, connecting, connect, publicKey } = useWallet();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawPct, setWithdrawPct] = useState("");

  // Real contract data
  const { poolBalanceXlm, totalShares, sharePriceXlm, maxBetXlm } = usePoolDisplayData();
  const { data: lpShares = 0n, isPending: isPendingShares } = useLpShares(publicKey);
  const { data: xlmBalance = 0, isPending: isPendingBalance } = useXlmBalance(publicKey);
  const positionLoading = connected && (isPendingShares || isPendingBalance);

  const depositMutation = useDeposit();
  const withdrawMutation = useWithdraw();
  const loading = depositMutation.isPending || withdrawMutation.isPending;

  // Derived values
  const userSharesNum = Number(lpShares);
  const totalSharesNum = Number(totalShares);
  const userValueXlm = sharePriceXlm > 0 ? userSharesNum * sharePriceXlm : 0;
  const poolShare = totalSharesNum > 0 ? (userSharesNum / totalSharesNum) * 100 : 0;

  const depositNum = Number(depositAmount) || 0;
  const depositShares = sharePriceXlm > 0 ? Math.floor(depositNum / sharePriceXlm) : 0;

  // Withdraw: user enters number of shares (in stroops units)
  const withdrawSharesNum = Number(withdrawPct) || 0;
  const withdrawXlm = sharePriceXlm > 0 ? Math.floor(withdrawSharesNum * sharePriceXlm) : 0;

  const handleDeposit = useCallback(async () => {
    if (depositNum < MIN_DEPOSIT || loading) return;
    try {
      await depositMutation.mutateAsync({ amountXlm: depositNum });
      setDepositAmount("");
      toast({
        title: `Deposited ${depositNum.toLocaleString()} XLM`,
        description: `Received ~${depositShares.toLocaleString()} shares`,
      });
    } catch (err: any) {
      toast({
        title: "Deposit failed",
        description: err?.message || "Transaction failed",
        variant: "destructive",
      });
    }
  }, [depositNum, depositShares, loading, toast, depositMutation]);

  const handleWithdraw = useCallback(async () => {
    if (withdrawSharesNum <= 0 || withdrawSharesNum > userSharesNum || loading) return;
    try {
      // Convert display shares to stroops bigint for the contract
      const sharesToWithdraw = BigInt(Math.round(withdrawSharesNum));
      await withdrawMutation.mutateAsync({ shares: sharesToWithdraw });
      setWithdrawPct("");
      toast({
        title: `Withdrew ${withdrawSharesNum.toLocaleString()} shares`,
        description: `Received ~${withdrawXlm.toLocaleString()} XLM`,
      });
    } catch (err: any) {
      toast({
        title: "Withdraw failed",
        description: err?.message || "Transaction failed",
        variant: "destructive",
      });
    }
  }, [withdrawSharesNum, withdrawXlm, userSharesNum, loading, toast, withdrawMutation]);

  // Format pool balance for display
  const formatPoolBalance = (xlm: number) => {
    if (xlm >= 1_000_000) return `${(xlm / 1_000_000).toFixed(1)}M`;
    if (xlm >= 1_000) return `${(xlm / 1_000).toFixed(1)}K`;
    return xlm.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatShares = (shares: bigint) => {
    const n = Number(shares);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="max-w-[960px] mx-auto py-6 px-4 space-y-5">
      {/* SECTION 1 — Pool Overview (hero stats card) */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-5">Pool Overview</span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          {/* TVL — hero metric */}
          <div className="col-span-2 lg:col-span-1">
            <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-1">Total Value Locked</span>
            <span className="block font-extrabold text-[32px] leading-tight text-foreground">
              {formatPoolBalance(poolBalanceXlm)}
              <span className="text-[16px] font-bold text-muted-foreground ml-1">XLM</span>
            </span>
          </div>

          {/* Share Price */}
          <div>
            <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-1">Share Price</span>
            <span className="block font-extrabold text-[20px] leading-tight text-zkachi-green">
              {sharePriceXlm.toFixed(4)}<span className="text-[13px] font-bold text-muted-foreground ml-1">XLM</span>
            </span>
            {sharePriceXlm > 1 && (
              <span className="block font-space text-[9px] text-muted-foreground/60 mt-1">
                +{((sharePriceXlm - 1) * 100).toFixed(2)}% since launch
              </span>
            )}
          </div>

          {/* Max Bet */}
          <div>
            <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-1">Max Bet</span>
            <span className="block font-extrabold text-[20px] leading-tight text-zkachi-gold">
              {Math.floor(maxBetXlm).toLocaleString()}<span className="text-[13px] font-bold text-muted-foreground ml-1">XLM</span>
            </span>
            <span className="block font-space text-[9px] text-muted-foreground/60 mt-1">2% of pool</span>
          </div>

          {/* Total Shares */}
          <div>
            <span className="block font-space text-[8px] tracking-[2px] uppercase text-muted-foreground mb-1">Total Shares</span>
            <span className="block font-extrabold text-[20px] leading-tight text-foreground">
              {formatShares(totalShares)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Position + Deposit/Withdraw (two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Position card */}
        <div className={`bg-card border rounded-2xl p-6 ${connected ? "border-border" : "border-dashed border-border"}`}>
          <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">Your Position</span>

          {!connected ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="font-space font-bold text-primary text-sm">LP</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Connect your wallet to view your position</p>
              <button
                onClick={connect}
                disabled={connecting}
                className="font-space text-[10px] tracking-[1.5px] uppercase bg-zkachi-gold/10 text-zkachi-gold border border-zkachi-gold/20 px-5 py-2.5 rounded-lg hover:bg-zkachi-gold/15 transition-colors disabled:opacity-50"
              >
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            </div>
          ) : positionLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-muted-foreground/10 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted-foreground/10 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Metric rows */}
              {[
                { label: "Your Shares", value: stroopsDisplay(lpShares), color: "text-foreground" },
                { label: "Your Value", value: `${Math.floor(userValueXlm).toLocaleString()} XLM`, color: "text-foreground" },
                { label: "Wallet Balance", value: `${xlmBalance.toFixed(2)} XLM`, color: "text-foreground" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="font-space text-[10px] tracking-[1px] uppercase text-muted-foreground">{m.label}</span>
                  <span className={`font-bold text-[15px] ${m.color}`}>{m.value}</span>
                </div>
              ))}

              {/* Pool Share with progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-space text-[10px] tracking-[1px] uppercase text-muted-foreground">Pool Share</span>
                  <span className="font-bold text-[15px] text-foreground">{poolShare.toFixed(2)}%</span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(poolShare, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deposit / Withdraw card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["deposit", "withdraw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 font-space text-[10px] tracking-[1.5px] uppercase py-3 border-b-2 transition-colors ${
                  tab === t
                    ? "text-zkachi-gold border-zkachi-gold"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "deposit" ? (
              <motion.div key="deposit" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="p-6">
                {/* Input */}
                <div className="relative mb-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-[24px] font-bold text-foreground outline-none focus:border-zkachi-gold/40 focus:ring-1 focus:ring-zkachi-gold/20 transition-all pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-space text-[11px] text-muted-foreground uppercase">XLM</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-space text-[10px] text-muted-foreground">Balance: {isPendingBalance ? "..." : `${xlmBalance.toFixed(2)} XLM`}</span>
                  <button onClick={() => setDepositAmount(String(Math.floor(xlmBalance - 1)))} className="font-space text-[9px] text-zkachi-gold hover:text-zkachi-gold/80 transition-colors">MAX</button>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mb-5">
                  {QUICK_DEPOSIT.map((v) => (
                    <button key={v} onClick={() => setDepositAmount(String(v))} className={`flex-1 rounded-lg py-2 font-space text-[10px] border transition-all ${
                      depositNum === v ? "border-zkachi-gold text-zkachi-gold bg-zkachi-gold/10" : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}>
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Preview */}
                {depositNum > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 mb-5 text-[11px] font-space text-muted-foreground">
                    <div className="flex justify-between"><span>You will receive</span><span className="text-foreground">~{depositShares.toLocaleString()} shares</span></div>
                    <div className="flex justify-between"><span>Share price</span><span>{sharePriceXlm.toFixed(4)} XLM</span></div>
                    <div className="flex justify-between"><span>Min deposit</span><span>{MIN_DEPOSIT} XLM</span></div>
                  </motion.div>
                )}

                <button
                  onClick={handleDeposit}
                  disabled={depositNum < MIN_DEPOSIT || loading || !connected}
                  className={`w-full font-space font-bold text-[10px] tracking-[1.5px] uppercase py-3 rounded-lg transition-all ${
                    depositNum >= MIN_DEPOSIT && !loading && connected
                      ? "bg-secondary text-secondary-foreground hover:opacity-90 shadow-lg shadow-zkachi-gold/20"
                      : "bg-border text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {loading ? "Processing..." : !connected ? "Connect Wallet" : "Deposit"}
                </button>
              </motion.div>
            ) : (
              <motion.div key="withdraw" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="p-6">
                {/* Input */}
                <div className="relative mb-2">
                  <input
                    type="number"
                    value={withdrawPct}
                    onChange={(e) => setWithdrawPct(e.target.value)}
                    placeholder="0"
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-[24px] font-bold text-foreground outline-none focus:border-zkachi-gold/40 focus:ring-1 focus:ring-zkachi-gold/20 transition-all pr-20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-space text-[11px] text-muted-foreground uppercase">Shares</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-space text-[10px] text-muted-foreground">Your shares: {isPendingShares ? "..." : stroopsDisplay(lpShares)}</span>
                  <button onClick={() => setWithdrawPct(String(userSharesNum))} className="font-space text-[9px] text-zkachi-gold hover:text-zkachi-gold/80 transition-colors">MAX</button>
                </div>

                {/* Quick percentages */}
                <div className="flex gap-2 mb-5">
                  {QUICK_WITHDRAW.map((pct) => {
                    const val = Math.floor(userSharesNum * pct / 100);
                    return (
                      <button key={pct} onClick={() => setWithdrawPct(String(val))} className={`flex-1 rounded-lg py-2 font-space text-[10px] border transition-all ${
                        withdrawSharesNum === val ? "border-zkachi-gold text-zkachi-gold bg-zkachi-gold/10" : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}>
                        {pct}%
                      </button>
                    );
                  })}
                </div>

                {/* Preview */}
                {withdrawSharesNum > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 mb-5 text-[11px] font-space text-muted-foreground">
                    <div className="flex justify-between"><span>You will receive</span><span className="text-foreground">~{withdrawXlm.toLocaleString()} XLM</span></div>
                    <div className="flex justify-between"><span>Share price</span><span>{sharePriceXlm.toFixed(4)} XLM</span></div>
                    <div className="flex justify-between"><span>Remaining shares</span><span>{Math.max(0, userSharesNum - withdrawSharesNum).toLocaleString()}</span></div>
                  </motion.div>
                )}

                <button
                  onClick={handleWithdraw}
                  disabled={withdrawSharesNum <= 0 || withdrawSharesNum > userSharesNum || loading || !connected}
                  className={`w-full font-space font-bold text-[10px] tracking-[1.5px] uppercase py-3 rounded-lg transition-all ${
                    withdrawSharesNum > 0 && withdrawSharesNum <= userSharesNum && !loading && connected
                      ? "border border-zkachi-gold/40 text-zkachi-gold bg-transparent hover:bg-zkachi-gold/5"
                      : "bg-border text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {loading ? "Processing..." : !connected ? "Connect Wallet" : "Withdraw"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function stroopsDisplay(val: bigint): string {
  const n = Number(val);
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default PoolPage;
