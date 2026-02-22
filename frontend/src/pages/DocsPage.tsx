const sections = [
  { id: "how-to-play", label: "How to Play" },
  { id: "bet-types", label: "Bet Types & Multipliers" },
  { id: "liquidity-pool", label: "Liquidity Pool" },
  { id: "verification", label: "How Verification Works" },
  { id: "cranker", label: "The Cranker" },
  { id: "contracts", label: "Contract Addresses" },
  { id: "architecture", label: "Architecture Overview" },
];

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const DocsPage = () => {
  return (
    <div className="max-w-[960px] mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">
          Documentation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything you need to know about ZKachi — zero-knowledge roulette on Soroban.
        </p>
      </div>

      <div className="flex gap-8">
        {/* TOC — sidebar */}
        <nav className="hidden lg:block w-48 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-2">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-3">
              Contents
            </span>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block font-space text-[10px] tracking-[1px] uppercase text-muted-foreground hover:text-zkachi-gold transition-colors py-1"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* How to Play */}
          <section id="how-to-play" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              How to Play
            </span>

            <div className="space-y-3">
              {[
                {
                  step: 1,
                  title: "Connect Wallet",
                  desc: "Install the Freighter browser extension and connect to the Stellar testnet. Click \"Connect Wallet\" in the top bar.",
                },
                {
                  step: 2,
                  title: "Wait for a Round",
                  desc: "The cranker bot automatically opens new rounds. When a round is open, the betting board becomes active.",
                },
                {
                  step: 3,
                  title: "Select Your Bet",
                  desc: "Click on a number, color, dozen, or other bet type on the roulette board. You can bet on a single number (straight) or a group.",
                },
                {
                  step: 4,
                  title: "Set Amount & Place Bet",
                  desc: "Enter your bet amount (max 2% of the pool). Sign the transaction in Freighter to submit your bet on-chain.",
                },
                {
                  step: 5,
                  title: "ZK Verification",
                  desc: "The cranker generates a Groth16 zero-knowledge proof that the result is fair, and submits it on-chain for verification.",
                },
                {
                  step: 6,
                  title: "See the Result",
                  desc: "The winning number is revealed. If you won, the payout is automatically sent to your wallet from the liquidity pool.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-background border border-border/50 rounded-xl p-4 flex gap-4"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-zkachi-gold/10 text-zkachi-gold font-space text-[11px] font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <div>
                    <span className="block font-bold text-sm text-foreground mb-0.5">
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bet Types & Multipliers */}
          <section id="bet-types" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              Bet Types & Multipliers
            </span>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase">Type</TableHead>
                  <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase">Description</TableHead>
                  <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase text-right">Payout</TableHead>
                  <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase text-right">Probability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { type: "Straight", desc: "Exact number (0–36)", payout: "36x", prob: "2.70%" },
                  { type: "Red / Black", desc: "Color", payout: "2x", prob: "48.65%" },
                  { type: "Even / Odd", desc: "Parity", payout: "2x", prob: "48.65%" },
                  { type: "Low / High", desc: "1–18 / 19–36", payout: "2x", prob: "48.65%" },
                  { type: "Dozen", desc: "1–12, 13–24, or 25–36", payout: "3x", prob: "32.43%" },
                ].map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-bold text-foreground text-xs">{row.type}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{row.desc}</TableCell>
                    <TableCell className="font-space text-xs font-bold text-zkachi-gold text-right">{row.payout}</TableCell>
                    <TableCell className="font-space text-xs text-muted-foreground text-right">{row.prob}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="bg-background border border-border/50 rounded-xl p-4 mt-4">
              <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">
                House Edge
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The house edge is approximately <span className="text-foreground font-bold">2.7%</span>, coming
                from the zero (0) on the wheel. When the ball lands on 0, all even-money and dozen bets
                lose. This is the same edge as European single-zero roulette.
              </p>
            </div>
          </section>

          {/* Liquidity Pool */}
          <section id="liquidity-pool" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              Liquidity Pool
            </span>

            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div>
                <span className="block font-bold text-sm text-foreground mb-1">How It Works</span>
                <p>
                  Liquidity Providers (LPs) deposit XLM into the pool and receive shares representing their
                  ownership. The pool acts as the house — it pays out winners and absorbs losses from losing bets.
                </p>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">Share Mechanics</span>
                <p>
                  When you deposit, you receive shares proportional to your contribution:{" "}
                  <code className="bg-background border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">
                    new_shares = deposit × total_shares / pool_balance
                  </code>
                </p>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">How LPs Earn</span>
                <p>
                  When players lose, 90% of their bet goes to the pool (the other 10% is the cranker fee).
                  This increases the pool balance while total shares stay the same, meaning each share is
                  worth more. Share price = pool_balance / total_shares.
                </p>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">Withdrawals</span>
                <p>
                  There is no lock-up period. LPs can withdraw their XLM at any time by burning their shares.
                  The withdrawal amount is proportional to their share of the pool.
                </p>
              </div>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-4 mt-4">
              <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-2">
                Key Parameters
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Cranker Fee", value: "10%" },
                  { label: "Max Bet", value: "2% of pool" },
                  { label: "House Edge", value: "~2.7%" },
                ].map((p) => (
                  <div key={p.label} className="text-center">
                    <span className="block font-space text-[8px] tracking-[1.5px] uppercase text-muted-foreground mb-0.5">
                      {p.label}
                    </span>
                    <span className="block font-bold text-sm text-foreground">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How Verification Works */}
          <section id="verification" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              How Verification Works
            </span>

            <div className="space-y-3">
              {[
                {
                  phase: "1. Commit",
                  desc: "The cranker generates a random seed and a secret salt, then publishes a commitment on-chain: commit = Poseidon(seed, salt). The seed and salt are hidden at this point.",
                },
                {
                  phase: "2. Bet",
                  desc: "The player submits their bet along with a player seed (seed_player). This seed adds player-contributed randomness to the outcome.",
                },
                {
                  phase: "3. Reveal",
                  desc: "The cranker computes the result: (seed_cranker + seed_player) % 37. Then it generates a Groth16 ZK proof that proves: the commitment is valid, the result is in [0, 36], and the calculation is correct — all without revealing the salt.",
                },
                {
                  phase: "4. On-chain Verification",
                  desc: "The verifier contract checks the Groth16 proof using BN254 elliptic curve pairing. If valid, the round is settled and payouts are distributed automatically.",
                },
              ].map((item) => (
                <div
                  key={item.phase}
                  className="bg-background border border-border/50 rounded-xl p-4"
                >
                  <span className="block font-bold text-sm text-foreground mb-1">
                    {item.phase}
                  </span>
                  <span className="block text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-4 mt-4 space-y-2">
              <div>
                <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">
                  Public Inputs
                </span>
                <p className="text-xs text-muted-foreground">
                  <code className="bg-card border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">commit</code>,{" "}
                  <code className="bg-card border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">seed_cranker</code>,{" "}
                  <code className="bg-card border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">seed_player</code>,{" "}
                  <code className="bg-card border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">result</code>
                </p>
              </div>
              <div>
                <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">
                  Private Input
                </span>
                <p className="text-xs text-muted-foreground">
                  <code className="bg-card border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">salt</code> — never revealed on-chain
                </p>
              </div>
              <div>
                <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-1">
                  Stack
                </span>
                <p className="text-xs text-muted-foreground">
                  Circom 2, Groth16, BN254 curve, Poseidon hash
                </p>
              </div>
            </div>
          </section>

          {/* The Cranker */}
          <section id="cranker" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              The Cranker
            </span>

            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div>
                <span className="block font-bold text-sm text-foreground mb-1">What Is It?</span>
                <p>
                  The cranker is an automated bot that manages game rounds. It commits seeds,
                  waits for bets, generates ZK proofs, and reveals results. It acts as the dealer
                  in the roulette game.
                </p>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">State Machine</span>
                <div className="bg-background border border-border/50 rounded-xl p-3 font-mono text-[11px] text-center text-foreground">
                  IDLE → COMMITTED → READY_REVEAL → IDLE
                </div>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">Bond</span>
                <p>
                  The cranker must post a minimum bond of <span className="text-foreground font-bold">50 XLM</span> per
                  round. The bond is returned after successful settlement. If the cranker fails to
                  reveal in time, the bond is forfeited to the player.
                </p>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">Fee</span>
                <p>
                  The cranker earns <span className="text-foreground font-bold">10%</span> of each losing bet as
                  a fee. This incentivizes running cranker infrastructure.
                </p>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">Timeout Protection</span>
                <p>
                  If the cranker doesn't reveal within <span className="text-foreground font-bold">~100 ledgers (~8 minutes)</span>,
                  the player can call <code className="bg-background border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">claim_timeout</code> to
                  recover their bet plus the cranker's bond.
                </p>
              </div>
            </div>
          </section>

          {/* Contract Addresses */}
          <section id="contracts" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              Contract Addresses
            </span>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase">Contract</TableHead>
                  <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase">Address</TableHead>
                  <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase">Function</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "Roulette",
                    addr: "CDEFWKZ5H7GAS4TIKODAKVIE2BIYVU3DWQLAVP43VXLI5MMGYWKLNWY2",
                    fn: "Game logic",
                  },
                  {
                    name: "Pool",
                    addr: "CB6LQB3TSVBLFSRLPNHVXLFMPUK2RNOTJEPLBISHDNX3VOEKPBLY7JZ2",
                    fn: "Liquidity pool",
                  },
                  {
                    name: "Hub",
                    addr: "CARXJDAZC2MII2HZ53WYT53FYN3TGMA4AORV76ORCGEYEBZMEI22NGNB",
                    fn: "Session tracking",
                  },
                  {
                    name: "Verifier",
                    addr: "CCSOBBUQW4LMT7TSG3CXW26OBTVMA6VZTXKFGFV2BSOTSXCXZVVPAUKZ",
                    fn: "ZK verification",
                  },
                  {
                    name: "XLM Token",
                    addr: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
                    fn: "XLM SAC",
                  },
                ].map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="font-bold text-foreground text-xs">{c.name}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground break-all">{c.addr}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.fn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="bg-background border border-border/50 rounded-xl p-4 mt-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Network:</span> Stellar Testnet — Network Passphrase:{" "}
                <code className="bg-card border border-border/50 rounded px-1.5 py-0.5 font-mono text-[11px]">
                  Test SDF Network ; September 2015
                </code>
              </p>
            </div>
          </section>

          {/* Architecture Overview */}
          <section id="architecture" className="scroll-mt-24 bg-card border border-border rounded-2xl p-6">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              Architecture Overview
            </span>

            <div className="bg-background border border-border/50 rounded-xl p-4 mb-4 overflow-x-auto">
              <pre className="font-mono text-[10px] leading-relaxed text-muted-foreground whitespace-pre">
{`┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Roulette    │────▶│   Verifier   │
│  React/Vite  │     │   Contract   │     │   Contract   │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
      ▼                    ▼                    ▼
┌──────────┐       ┌──────────────┐     ┌──────────────┐
│   Pool   │       │     Hub      │     │   Cranker    │
│ Contract │       │   Contract   │     │   Node.js    │
└──────────┘       └──────────────┘     └──────────────┘`}
              </pre>
            </div>

            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div>
                <span className="block font-bold text-sm text-foreground mb-1">Tech Stack</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { label: "Smart Contracts", value: "Rust / Soroban SDK" },
                    { label: "ZK Circuit", value: "Circom 2 / snarkjs" },
                    { label: "Frontend", value: "React / Vite / Tailwind" },
                    { label: "Cranker Bot", value: "Node.js" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-background border border-border/50 rounded-lg p-2.5"
                    >
                      <span className="block font-space text-[8px] tracking-[1.5px] uppercase text-muted-foreground mb-0.5">
                        {s.label}
                      </span>
                      <span className="block text-xs font-bold text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="block font-bold text-sm text-foreground mb-1">Data Flow</span>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                  <li>Deploy contracts (pool, verifier, roulette, hub)</li>
                  <li>Initialize with cross-contract references</li>
                  <li>Seed the pool with initial liquidity</li>
                  <li>Cranker opens rounds: commit → wait for bet → reveal with ZK proof</li>
                  <li>Settlement: pool pays winner or absorbs loss, hub records session</li>
                </ol>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
