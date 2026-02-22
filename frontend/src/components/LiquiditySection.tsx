import { motion } from "framer-motion";

const stats = [
  { value: "2.7%", label: "HOUSE EDGE", desc: "Mathematically fixed via European roulette rules" },
  { value: "2%", label: "MAX BET CAP", desc: "Of total pool — risk is always controlled" },
  { value: "Anytime", label: "WITHDRAW", desc: "No lock-ups — your liquidity, your choice" },
];

const LiquiditySection = () => {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <span className="font-space text-[11px] tracking-[0.2em] uppercase text-zkachi-gold bg-zkachi-gold/10 rounded-full px-4 py-1.5">
            Liquidity Pool
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-3xl lg:text-5xl font-extrabold text-center leading-tight mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-foreground">Be the House. Earn the </span>
          <span className="text-zkachi-gold">Edge</span>
          <span className="text-foreground">.</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="text-base text-muted-foreground font-light text-center max-w-2xl mx-auto leading-relaxed mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.2 }}
        >
          Deposit into the ZKachi liquidity pool and earn yield from the 2.7% house edge.
          Every losing bet grows the pool — every winning bet is paid from it.
        </motion.p>

        {/* Stat cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              className="bg-card border border-border rounded-2xl p-6 text-center"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5 }}
            >
              <span className="block text-[28px] font-bold text-zkachi-gold leading-none mb-2">{s.value}</span>
              <span className="block font-space text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">{s.label}</span>
              <span className="block text-xs text-muted-foreground/70 font-light leading-relaxed">{s.desc}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Pool Status card */}
          <motion.div
          className="w-full bg-card border border-border rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-6 pt-5 pb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-green" />
            <span className="font-space text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              Pool Status · Live
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 px-8 pb-6">
            <div className="text-center">
              <span className="block text-sm text-muted-foreground/60 font-space uppercase tracking-[0.15em] mb-2">Balance</span>
              <span className="block text-xl font-bold text-foreground">$2.4M</span>
            </div>
            <div className="text-center border-x border-border">
              <span className="block text-sm text-muted-foreground/60 font-space uppercase tracking-[0.15em] mb-2">Share Price</span>
              <span className="block text-xl font-bold text-emerald-400">$1.027</span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-muted-foreground/60 font-space uppercase tracking-[0.15em] mb-2">Total Shares</span>
              <span className="block text-xl font-bold text-foreground">2.34M</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiquiditySection;
