import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Dice5,
  Droplets,
  ScanSearch,
  Bot,
  FileCode2,
  Layers,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { stellarExpertUrl } from "@/lib/soroban";

/* ── animation variants (same as TrustSection) ── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── data ── */

const sections = [
  { id: "how-to-play", label: "How to Play", icon: Shield },
  { id: "bet-types", label: "Bet Types", icon: Dice5 },
  { id: "liquidity-pool", label: "Liquidity Pool", icon: Droplets },
  { id: "verification", label: "ZK Verification", icon: ScanSearch },
  { id: "cranker", label: "The Cranker", icon: Bot },
  { id: "contracts", label: "Contracts", icon: FileCode2 },
  { id: "architecture", label: "Architecture", icon: Layers },
];

const playSteps = [
  {
    step: 1,
    title: "Connect Wallet",
    desc: 'Install the Freighter browser extension and connect to the Stellar testnet. Click "Connect Wallet" in the top bar.',
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
];

const betTypes = [
  { type: "Straight", desc: "Exact number (0–36)", payout: "36x", prob: "2.70%" },
  { type: "Red / Black", desc: "Color", payout: "2x", prob: "48.65%" },
  { type: "Even / Odd", desc: "Parity", payout: "2x", prob: "48.65%" },
  { type: "Low / High", desc: "1–18 / 19–36", payout: "2x", prob: "48.65%" },
  { type: "Dozen", desc: "1–12, 13–24, or 25–36", payout: "3x", prob: "32.43%" },
];

const poolTopics = [
  {
    title: "How It Works",
    desc: "LPs deposit XLM into the pool and receive shares representing their ownership. The pool acts as the house — it pays out winners and absorbs losses from losing bets.",
  },
  {
    title: "Share Mechanics",
    desc: "When you deposit, you receive shares proportional to your contribution: new_shares = deposit × total_shares / pool_balance.",
  },
  {
    title: "How LPs Earn",
    desc: "When players lose, 90% of their bet goes to the pool (10% is cranker fee). This increases pool balance while total shares stay the same — each share is worth more.",
  },
  {
    title: "Withdrawals",
    desc: "No lock-up period. LPs can withdraw XLM at any time by burning shares. The amount is proportional to their share of the pool.",
  },
];

const verificationPhases = [
  {
    title: "Commit",
    desc: "The cranker generates a random seed and a secret salt, then publishes a commitment on-chain: commit = Poseidon(seed, salt). The seed and salt are hidden at this point.",
  },
  {
    title: "Bet",
    desc: "The player submits their bet along with a player seed (seed_player). This seed adds player-contributed randomness to the outcome.",
  },
  {
    title: "Reveal",
    desc: "The cranker computes the result: (seed_cranker + seed_player) % 37. Then it generates a Groth16 ZK proof that proves the commitment is valid, the result is in [0, 36], and the calculation is correct — all without revealing the salt.",
  },
  {
    title: "On-chain Verification",
    desc: "The verifier contract checks the Groth16 proof using BN254 elliptic curve pairing. If valid, the round is settled and payouts are distributed automatically.",
  },
];

const crankerTopics = [
  {
    id: "what-is-it",
    title: "What Is It?",
    content:
      "The cranker is an automated bot that manages game rounds. It commits seeds, waits for bets, generates ZK proofs, and reveals results. It acts as the dealer in the roulette game.",
  },
  {
    id: "state-machine",
    title: "State Machine",
    content: "STATE_MACHINE_DIAGRAM",
  },
  {
    id: "bond",
    title: "Bond",
    content:
      "The cranker must post a minimum bond of 50 XLM per round. The bond is returned after successful settlement. If the cranker fails to reveal in time, the bond is forfeited to the player.",
  },
  {
    id: "fee",
    title: "Fee",
    content:
      "The cranker earns 10% of each losing bet as a fee. This incentivizes running cranker infrastructure.",
  },
  {
    id: "timeout",
    title: "Timeout Protection",
    content:
      "If the cranker doesn't reveal within ~100 ledgers (~8 minutes), the player can call claim_timeout to recover their bet plus the cranker's bond.",
  },
];

const flowSteps = [
  { from: "Cranker", fromSub: "Node.js", fromColor: "gold" as const, label: "Commit & Reveal", to: "Roulette", toSub: "Contract", toColor: "purple" as const },
  { from: "Frontend", fromSub: "React", fromColor: "gold" as const, label: "Place Bet", to: "Roulette", toSub: "Contract", toColor: "purple" as const },
  { from: "Roulette", fromSub: "Contract", fromColor: "purple" as const, label: "Verify Proof", to: "Verifier", toSub: "Contract", toColor: "purple" as const },
  { from: "Roulette", fromSub: "Contract", fromColor: "purple" as const, label: "Payout / Absorb", to: "Pool", toSub: "Contract", toColor: "purple" as const },
  { from: "Roulette", fromSub: "Contract", fromColor: "purple" as const, label: "Record Session", to: "Hub", toSub: "Contract", toColor: "purple" as const },
];

const contracts = [
  { name: "Roulette", addr: "CDEFWKZ5H7GAS4TIKODAKVIE2BIYVU3DWQLAVP43VXLI5MMGYWKLNWY2", fn: "Game logic" },
  { name: "Pool", addr: "CB6LQB3TSVBLFSRLPNHVXLFMPUK2RNOTJEPLBISHDNX3VOEKPBLY7JZ2", fn: "Liquidity pool" },
  { name: "Hub", addr: "CARXJDAZC2MII2HZ53WYT53FYN3TGMA4AORV76ORCGEYEBZMEI22NGNB", fn: "Session tracking" },
  { name: "Verifier", addr: "CCSOBBUQW4LMT7TSG3CXW26OBTVMA6VZTXKFGFV2BSOTSXCXZVVPAUKZ", fn: "ZK verification" },
  { name: "XLM Token", addr: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", fn: "XLM SAC" },
];

/* ── inline divider ── */

const GradientDivider = () => (
  <div className="relative py-4 flex items-center justify-center">
    <div
      className="w-[120px] h-px opacity-20"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, hsl(var(--zkachi-purple)) 30%, hsl(var(--zkachi-gold)) 70%, transparent 100%)",
      }}
    />
  </div>
);

/* ── section header ── */

const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accent: "gold" | "purple";
}) => (
  <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        accent === "gold" ? "bg-zkachi-gold/10" : "bg-zkachi-purple/10"
      }`}
    >
      <Icon
        size={20}
        className={accent === "gold" ? "text-zkachi-gold" : "text-zkachi-purple"}
      />
    </div>
    <div>
      <h2 className="text-xl lg:text-2xl font-extrabold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground font-light mt-0.5">{subtitle}</p>
    </div>
  </motion.div>
);

/* ── arch box helper ── */

const ArchBox = ({ name, sub, color }: { name: string; sub: string; color: "gold" | "purple" }) => (
  <div
    className={`border rounded-xl px-4 py-2.5 text-center min-w-[100px] ${
      color === "gold" ? "border-zkachi-gold/30 bg-zkachi-gold/5" : "border-zkachi-purple/30 bg-zkachi-purple/5"
    }`}
  >
    <span className="block font-bold text-sm text-foreground">{name}</span>
    <span className="block font-space text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{sub}</span>
  </div>
);

/* ── main component ── */

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState("how-to-play");
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, IntersectionObserverEntry>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionRefs.current[entry.target.id] = entry;
        });
        const visible = sections
          .map((s) => sectionRefs.current[s.id])
          .filter((entry) => entry?.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const copyAddress = useCallback((addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  }, []);

  return (
    <div className="py-10 px-4">
      {/* ── Hero ── */}
      <motion.div
        className="max-w-3xl mx-auto text-center mb-16 relative"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, hsla(263,76%,66%,0.06) 0%, transparent 70%)",
          }}
        />

        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <span className="font-space text-[11px] tracking-[0.2em] uppercase text-zkachi-gold bg-zkachi-gold/10 rounded-full px-4 py-1.5">
            Documentation
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-3xl lg:text-5xl font-extrabold leading-tight mb-5"
        >
          <span className="text-foreground">How </span>
          <span className="text-zkachi-gold">ZK</span>
          <span className="text-zkachi-purple">achi</span>
          <span className="text-foreground"> Works</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-base text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto"
        >
          Zero-knowledge roulette on Stellar/Soroban. Every spin is provably fair,
          every result is verified on-chain.
        </motion.p>
      </motion.div>

      {/* ── Divider ── */}
      <GradientDivider />

      {/* ── Two-column layout ── */}
      <div className="max-w-[1080px] mx-auto flex gap-10">
        {/* TOC sidebar */}
        <nav className="hidden lg:block w-56 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-1">
            <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-4">
              Contents
            </span>
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-zkachi-gold/10 border border-zkachi-gold/20"
                      : "border border-transparent hover:bg-card"
                  }`}
                >
                  <Icon
                    size={14}
                    className={`shrink-0 transition-colors duration-200 ${
                      isActive
                        ? "text-zkachi-gold"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span
                    className={`font-space text-[10px] tracking-[0.5px] uppercase transition-colors duration-200 ${
                      isActive
                        ? "text-zkachi-gold font-bold"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-12">

          {/* ═══ HOW TO PLAY ═══ */}
          <motion.section
            id="how-to-play"
            className="scroll-mt-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <SectionHeader icon={Shield} title="How to Play" subtitle="Getting started with ZKachi" accent="gold" />

            <motion.div variants={fadeUp} className="space-y-3">
              {playSteps.map((item) => (
                <div key={item.step} className="bg-card border border-border rounded-xl px-5 py-4">
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-zkachi-gold/10 text-zkachi-gold font-space text-xs font-bold flex items-center justify-center mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <span className="block font-bold text-sm text-foreground mb-1">{item.title}</span>
                      <span className="block text-sm text-muted-foreground leading-relaxed">{item.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.section>

          <GradientDivider />

          {/* ═══ BET TYPES ═══ */}
          <motion.section
            id="bet-types"
            className="scroll-mt-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <SectionHeader icon={Dice5} title="Bet Types & Multipliers" subtitle="Payouts and probabilities" accent="purple" />

            <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zkachi-purple/5 border-b border-border">
                    <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase text-zkachi-purple">Type</TableHead>
                    <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase text-zkachi-purple">Description</TableHead>
                    <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase text-zkachi-purple text-right">Payout</TableHead>
                    <TableHead className="font-space text-[9px] tracking-[1.5px] uppercase text-zkachi-purple text-right">Probability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {betTypes.map((row, i) => (
                    <TableRow key={row.type} className={i % 2 === 0 ? "bg-transparent" : "bg-background/50"}>
                      <TableCell className="font-bold text-foreground text-sm">{row.type}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.desc}</TableCell>
                      <TableCell className="font-space text-sm font-bold text-zkachi-gold text-right">{row.payout}</TableCell>
                      <TableCell className="font-space text-sm text-muted-foreground text-right">{row.prob}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-card border-l-4 border-l-zkachi-gold border border-border rounded-xl p-5 mt-6"
            >
              <span className="block font-bold text-sm text-foreground mb-1">House Edge — How It Works</span>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The house edge is approximately <span className="text-zkachi-gold font-bold">2.7%</span> (1/37),
                coming from the zero (0) on the wheel. There are 37 possible outcomes (0–36), but payouts are
                calculated as if there were only 36 — for example, a straight bet pays <span className="text-zkachi-gold font-bold">36x</span> despite
                having a 1-in-37 chance.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                This means on every bet type, the expected return is 36/37 ≈ 97.3%. The remaining 2.7% is
                the statistical advantage that accrues to the liquidity pool over time.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When a player loses, <span className="text-zkachi-gold font-bold">90%</span> of the bet goes to the pool (increasing
                LP share value) and <span className="text-zkachi-gold font-bold">10%</span> goes to the cranker as a fee for
                operating the infrastructure. This is the same edge as European single-zero roulette.
              </p>
            </motion.div>
          </motion.section>

          <GradientDivider />

          {/* ═══ LIQUIDITY POOL ═══ */}
          <motion.section
            id="liquidity-pool"
            className="scroll-mt-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <SectionHeader icon={Droplets} title="Liquidity Pool" subtitle="LP mechanics and earnings" accent="gold" />

            <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poolTopics.map((topic) => (
                <motion.div
                  key={topic.title}
                  variants={fadeUp}
                  className="bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:border-muted hover:-translate-y-1"
                >
                  <span className="block font-bold text-sm text-foreground mb-2">{topic.title}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{topic.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: "Cranker Fee", value: "10%", accent: "text-zkachi-gold" },
                { label: "Max Bet", value: "2%", accent: "text-zkachi-purple" },
                { label: "House Edge", value: "~2.7%", accent: "text-foreground" },
              ].map((p) => (
                <div key={p.label} className="bg-card border border-border rounded-2xl p-5 text-center">
                  <span className={`block text-[24px] font-bold leading-none mb-2 ${p.accent}`}>
                    {p.value}
                  </span>
                  <span className="block font-space text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    {p.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.section>

          <GradientDivider />

          {/* ═══ ZK VERIFICATION ═══ */}
          <motion.section
            id="verification"
            className="scroll-mt-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <SectionHeader icon={ScanSearch} title="ZK Verification" subtitle="Groth16 proof system" accent="purple" />

            <motion.div variants={staggerContainer} className="space-y-4">
              {verificationPhases.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:border-muted hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-block font-space text-xs text-primary bg-primary/10 rounded-lg px-3 py-1 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="block font-bold text-sm text-foreground mb-2">{item.title}</span>
                      <span className="block text-sm text-muted-foreground leading-relaxed">{item.desc}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-card border-l-4 border-l-zkachi-purple border border-border rounded-xl p-5 mt-6 space-y-4"
            >
              <div>
                <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-2">
                  Public Inputs
                </span>
                <div className="flex flex-wrap gap-2">
                  {["commit", "seed_cranker", "seed_player", "result"].map((input) => (
                    <code
                      key={input}
                      className="bg-background border border-border/50 rounded-md px-2 py-1 font-mono text-xs text-foreground"
                    >
                      {input}
                    </code>
                  ))}
                </div>
              </div>
              <div>
                <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-2">
                  Private Input
                </span>
                <code className="bg-background border border-border/50 rounded-md px-2 py-1 font-mono text-xs text-foreground">
                  salt
                </code>
                <span className="text-sm text-muted-foreground ml-2">— never revealed on-chain</span>
              </div>
              <div>
                <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-2">
                  Stack
                </span>
                <span className="text-sm text-muted-foreground">
                  Circom 2, Groth16, BN254 curve, Poseidon hash
                </span>
              </div>
            </motion.div>
          </motion.section>

          <GradientDivider />

          {/* ═══ THE CRANKER ═══ */}
          <motion.section
            id="cranker"
            className="scroll-mt-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <SectionHeader icon={Bot} title="The Cranker" subtitle="Automated round management" accent="gold" />

            <motion.div variants={fadeUp} className="space-y-3">
              {crankerTopics.map((topic) => (
                <div key={topic.id} className="bg-card border border-border rounded-xl px-5 py-4">
                  <span className="block font-bold text-sm text-foreground mb-2">{topic.title}</span>
                  {topic.content === "STATE_MACHINE_DIAGRAM" ? (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 flex-wrap">
                      {["IDLE", "COMMITTED", "READY_REVEAL", "IDLE"].map((state, i, arr) => (
                        <Fragment key={`${state}-${i}`}>
                          <span className="font-space text-[10px] sm:text-xs font-bold text-foreground bg-background border border-border rounded-lg px-3 py-2">
                            {state}
                          </span>
                          {i < arr.length - 1 && (
                            <ChevronRight size={16} className="text-zkachi-gold shrink-0" />
                          )}
                        </Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">{topic.content}</p>
                  )}
                </div>
              ))}
            </motion.div>
          </motion.section>

          <GradientDivider />

          {/* ═══ CONTRACT ADDRESSES ═══ */}
          <motion.section
            id="contracts"
            className="scroll-mt-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <SectionHeader icon={FileCode2} title="Contract Addresses" subtitle="Deployed on Stellar testnet" accent="purple" />

            <motion.div variants={staggerContainer} className="space-y-3">
              {contracts.map((c) => (
                <motion.div
                  key={c.name}
                  variants={fadeUp}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3 sm:w-28 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-zkachi-green" />
                    <span className="font-bold text-sm text-foreground">{c.name}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <code className="block font-mono text-[10px] sm:text-xs text-muted-foreground break-all">
                      {c.addr}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyAddress(c.addr)}
                      className="flex items-center gap-1.5 font-space text-[9px] tracking-[1px] uppercase text-zkachi-gold hover:text-zkachi-gold/80 transition-colors px-2 py-1.5 rounded-md bg-zkachi-gold/5 hover:bg-zkachi-gold/10"
                    >
                      {copiedAddr === c.addr ? <Check size={12} /> : <Copy size={12} />}
                      {copiedAddr === c.addr ? "Copied" : "Copy"}
                    </button>
                    <a
                      href={stellarExpertUrl("contract", c.addr)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-space text-[9px] tracking-[1px] uppercase text-zkachi-purple hover:text-zkachi-purple/80 transition-colors px-2 py-1.5 rounded-md bg-zkachi-purple/5 hover:bg-zkachi-purple/10"
                    >
                      <ExternalLink size={12} />
                      Explorer
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-card border-l-4 border-l-zkachi-purple border border-border rounded-xl p-5 mt-6"
            >
              <span className="block font-bold text-sm text-foreground mb-1">Network</span>
              <p className="text-sm text-muted-foreground">
                Stellar Testnet —{" "}
                <code className="bg-background border border-border/50 rounded-md px-2 py-0.5 font-mono text-xs">
                  Test SDF Network ; September 2015
                </code>
              </p>
            </motion.div>
          </motion.section>

          <GradientDivider />

          {/* ═══ ARCHITECTURE ═══ */}
          <motion.section
            id="architecture"
            className="scroll-mt-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <SectionHeader icon={Layers} title="Architecture" subtitle="System design overview" accent="gold" />

            {/* Numbered Flow Diagram */}
            <motion.div variants={fadeUp} className="bg-card border border-border rounded-2xl p-8 mb-6">
              <div className="space-y-4">
                {flowSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 flex-wrap justify-center">
                    <ArchBox name={step.from} sub={step.fromSub} color={step.fromColor} />
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-zkachi-gold/10 text-zkachi-gold font-space text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-space text-[10px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {step.label}
                      </span>
                      <ChevronRight size={14} className="text-zkachi-gold shrink-0" />
                    </div>
                    <ArchBox name={step.to} sub={step.toSub} color={step.toColor} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tech Stack */}
            <motion.div variants={fadeUp} className="mb-6">
              <span className="block font-bold text-sm text-foreground mb-3">Tech Stack</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Smart Contracts", value: "Rust / Soroban SDK" },
                  { label: "ZK Circuit", value: "Circom 2 / snarkjs" },
                  { label: "Frontend", value: "React / Vite / Tailwind" },
                  { label: "Cranker Bot", value: "Node.js" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:border-muted hover:-translate-y-1"
                  >
                    <span className="block font-space text-[8px] tracking-[1.5px] uppercase text-muted-foreground mb-1">
                      {s.label}
                    </span>
                    <span className="block text-sm font-bold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Data Flow */}
            <motion.div variants={fadeUp}>
              <span className="block font-bold text-sm text-foreground mb-3">Data Flow</span>
              <div className="bg-card border border-border rounded-xl p-5">
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Deploy contracts (pool, verifier, roulette, hub)</li>
                  <li>Initialize with cross-contract references</li>
                  <li>Seed the pool with initial liquidity</li>
                  <li>Cranker opens rounds: commit → wait for bet → reveal with ZK proof</li>
                  <li>Settlement: pool pays winner or absorbs loss, hub records session</li>
                </ol>
              </div>
            </motion.div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
