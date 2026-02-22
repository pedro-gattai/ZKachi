import { motion } from "framer-motion";

const DarumaMedium = () => (
  <div className="flex items-center justify-center relative">
    <div
      className="absolute w-[240px] h-[240px] rounded-full animate-glow-pulse"
      style={{ background: "radial-gradient(circle, hsla(42,60%,55%,0.2) 0%, transparent 70%)" }}
    />
    <div className="animate-float-daruma-small relative">
      <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden lg:block">
        <circle cx="100" cy="105" r="90" stroke="hsl(var(--zkachi-gold))" strokeWidth="0.5" strokeDasharray="6 4" opacity="0.15" />
        <ellipse cx="100" cy="110" rx="72" ry="80" fill="#14121E" stroke="hsl(var(--zkachi-gold))" strokeWidth="2" />
        <ellipse cx="100" cy="90" rx="48" ry="40" fill="hsl(var(--zkachi-surface))" opacity="0.6" />
        <path d="M65 72 Q78 64 90 72" stroke="hsl(var(--zkachi-gold))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M110 72 Q122 64 135 72" stroke="hsl(var(--zkachi-purple))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="78" cy="88" r="14" fill="hsl(var(--zkachi-gold))" />
        <circle cx="78" cy="88" r="8" fill="#14121E" />
        <circle cx="74" cy="84" r="4" fill="white" opacity="0.8" />
        <circle cx="122" cy="88" r="14" fill="hsl(var(--zkachi-purple))" />
        <text x="122" y="93" fontSize="12" fill="white" fontFamily="'Space Mono', monospace" textAnchor="middle" fontWeight="bold">ZK</text>
        <rect x="112" y="79" width="4" height="2" fill="hsl(var(--zkachi-purple))" opacity="0.5" />
        <rect x="130" y="85" width="3" height="2" fill="hsl(var(--zkachi-purple))" opacity="0.4" />
        <path d="M88 108 Q100 118 112 108" stroke="hsl(var(--zkachi-gold))" strokeWidth="2" strokeLinecap="round" fill="none" />
        <text x="100" y="155" fontSize="24" fill="hsl(var(--zkachi-gold))" fontFamily="serif" textAnchor="middle" opacity="0.1">勝</text>
      </svg>
      {/* Mobile: smaller */}
      <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="lg:hidden">
        <circle cx="100" cy="105" r="90" stroke="hsl(var(--zkachi-gold))" strokeWidth="0.5" strokeDasharray="6 4" opacity="0.15" />
        <ellipse cx="100" cy="110" rx="72" ry="80" fill="#14121E" stroke="hsl(var(--zkachi-gold))" strokeWidth="2" />
        <ellipse cx="100" cy="90" rx="48" ry="40" fill="hsl(var(--zkachi-surface))" opacity="0.6" />
        <path d="M65 72 Q78 64 90 72" stroke="hsl(var(--zkachi-gold))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M110 72 Q122 64 135 72" stroke="hsl(var(--zkachi-purple))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="78" cy="88" r="14" fill="hsl(var(--zkachi-gold))" />
        <circle cx="78" cy="88" r="8" fill="#14121E" />
        <circle cx="74" cy="84" r="4" fill="white" opacity="0.8" />
        <circle cx="122" cy="88" r="14" fill="hsl(var(--zkachi-purple))" />
        <text x="122" y="93" fontSize="12" fill="white" fontFamily="'Space Mono', monospace" textAnchor="middle" fontWeight="bold">ZK</text>
        <path d="M88 108 Q100 118 112 108" stroke="hsl(var(--zkachi-gold))" strokeWidth="2" strokeLinecap="round" fill="none" />
        <text x="100" y="155" fontSize="24" fill="hsl(var(--zkachi-gold))" fontFamily="serif" textAnchor="middle" opacity="0.1">勝</text>
      </svg>
    </div>
  </div>
);

const ShieldIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path d="M24 4L6 12V22C6 33.1 13.7 43.3 24 46C34.3 43.3 42 33.1 42 22V12L24 4Z" stroke="hsl(var(--zkachi-gold))" strokeWidth="2" fill="hsl(var(--zkachi-gold)/0.1)" />
    <path d="M18 24L22 28L30 20" stroke="hsl(var(--zkachi-gold))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DiceIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="8" width="32" height="32" rx="6" stroke="hsl(var(--zkachi-purple))" strokeWidth="2" fill="hsl(var(--zkachi-purple)/0.1)" />
    <circle cx="18" cy="18" r="2.5" fill="hsl(var(--zkachi-purple))" />
    <circle cx="30" cy="18" r="2.5" fill="hsl(var(--zkachi-purple))" />
    <circle cx="24" cy="24" r="2.5" fill="hsl(var(--zkachi-purple))" />
    <circle cx="18" cy="30" r="2.5" fill="hsl(var(--zkachi-purple))" />
    <circle cx="30" cy="30" r="2.5" fill="hsl(var(--zkachi-purple))" />
  </svg>
);

const VerifyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="22" cy="22" r="14" stroke="hsl(var(--zkachi-gold))" strokeWidth="2" fill="hsl(var(--zkachi-gold)/0.1)" />
    <path d="M32 32L42 42" stroke="hsl(var(--zkachi-gold))" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M16 22L20 26L28 18" stroke="hsl(var(--zkachi-gold))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const steps = [
  { num: "01", title: "Place Your Bet", desc: "Your bet is encrypted using Zero Knowledge proofs before it ever touches the blockchain. The house never sees your strategy, your amount stays private until settlement.", icon: <ShieldIcon /> },
  { num: "02", title: "Provably Random Spin", desc: "The result is generated using verifiable random functions on-chain. No server-side RNG, no hidden seeds. The randomness is cryptographically guaranteed and tamper-proof.", icon: <DiceIcon /> },
  { num: "03", title: "Verify Everything", desc: "After every spin, a ZK proof is published on-chain. Anyone can verify the result was fair. Not just trust — mathematical certainty.", icon: <VerifyIcon /> },
];

const traditionalPoints = [
  "House controls the RNG",
  "Results can't be independently verified",
  "Your betting data is stored and tracked",
  "Trust based on licensing, not proof",
  "Opaque algorithms behind closed doors",
];

const zkPoints = [
  "On-chain verifiable randomness",
  "Every spin has a public ZK proof",
  "Bets are encrypted — your data stays yours",
  "Trust based on mathematics, not promises",
  "Open-source, auditable smart contracts",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const TrustSection = () => {
  return (
    <section className="relative w-full py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header: Daruma left + text right */}
        <motion.div
          className="flex flex-col lg:grid lg:grid-cols-[auto_1fr] gap-8 lg:gap-12 items-center mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div variants={fadeUp} className="shrink-0">
            <DarumaMedium />
          </motion.div>
          <div className="text-center lg:text-left">
            <motion.h2
              className="text-3xl lg:text-5xl font-extrabold leading-tight"
              variants={fadeUp}
            >
              <span className="text-foreground">Don't trust the house.</span>
              <br />
              <span className="text-secondary">Trust the math.</span>
            </motion.h2>
            <motion.p
              className="mt-6 text-base text-muted-foreground font-light max-w-xl leading-relaxed"
              variants={fadeUp}
            >
              ZKachi uses Zero Knowledge proofs to guarantee every spin is truly random and verifiable. No hidden algorithms. No house manipulation. Just pure, provable mathematics.
            </motion.p>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
          {/* Desktop dashed connectors */}
          {[0, 1].map((i) => (
            <div
              key={i}
              className="hidden lg:flex absolute top-1/2 -translate-y-1/2 items-center pointer-events-none"
              style={{ left: `calc(${(i + 1) * 33.33}% - 12px)`, width: "24px" }}
            >
              <svg width="24" height="12" viewBox="0 0 24 12">
                <line x1="0" y1="6" x2="18" y2="6" stroke="hsl(var(--zkachi-purple))" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />
                <polygon points="18,2 24,6 18,10" fill="hsl(var(--zkachi-purple))" opacity="0.3" />
              </svg>
            </div>
          ))}

          {steps.map((step, i) => (
            <motion.div key={step.num} variants={fadeUp}>
              {i > 0 && (
                <div className="lg:hidden flex justify-center -mt-3 mb-3">
                  <svg width="2" height="32">
                    <line x1="1" y1="0" x2="1" y2="32" stroke="hsl(var(--zkachi-purple))" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />
                  </svg>
                </div>
              )}
              <div className="bg-card border border-border rounded-2xl p-8 transition-all duration-300 hover:border-muted hover:-translate-y-1 h-full">
                <span className="inline-block font-space text-xs text-primary bg-primary/10 rounded-lg px-3 py-1 mb-5">
                  {step.num}
                </span>
                <div className="mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Versus Title */}
        <motion.div
          className="text-center mb-12 mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-3xl lg:text-4xl font-extrabold">
            <span className="text-foreground">Why </span>
            <span className="text-zkachi-gold">ZKachi</span>
            <span className="text-foreground">?</span>
          </h3>
          <p className="text-sm text-muted-foreground font-light mt-3 max-w-md mx-auto">
            See how provably fair gaming compares to the traditional casino model.
          </p>
        </motion.div>

        {/* Versus */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
              <span className="font-space text-xs font-bold text-muted-foreground">VS</span>
            </div>
          </div>

          <motion.div
            className="bg-card border border-border rounded-2xl p-8"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h3 className="text-lg font-bold text-muted-foreground mb-6">Traditional Casino</h3>
            <ul className="space-y-4">
              {traditionalPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="text-destructive mt-0.5 shrink-0">✕</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="lg:hidden flex justify-center -my-3">
            <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center">
              <span className="font-space text-xs font-bold text-muted-foreground">VS</span>
            </div>
          </div>

          <motion.div
            className="bg-card border rounded-2xl p-8 glow-purple"
            style={{ borderColor: "hsl(263 76% 66% / 0.3)" }}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h3 className="text-lg font-bold">
              <span className="text-foreground">ZK</span>
              <span className="text-secondary">achi</span>
            </h3>
            <ul className="mt-6 space-y-4">
              {zkPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="text-zkachi-green mt-0.5 shrink-0">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
