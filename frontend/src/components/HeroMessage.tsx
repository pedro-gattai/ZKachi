import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const },
  }),
};

const HeroMessage = () => {
  return (
    <motion.div
      className="flex flex-col items-center lg:items-start gap-6"
      initial="hidden"
      animate="visible"
    >
      <motion.span
        custom={0}
        variants={fadeUp}
        className="font-space text-xs tracking-wider uppercase text-zkachi-purple bg-zkachi-purple/10 border border-zkachi-purple/15 rounded-full px-5 py-1.5"
      >
        Provably Fair · On-Chain
      </motion.span>

      <motion.h1
        custom={1}
        variants={fadeUp}
        className="text-4xl lg:text-5xl font-extrabold leading-tight text-center lg:text-left"
      >
        Every spin is{" "}
        <span className="text-zkachi-gold">verified</span>.
        <br />
        Every result is{" "}
        <span className="text-zkachi-purple">provable</span>.
      </motion.h1>

      <motion.p
        custom={2}
        variants={fadeUp}
        className="text-base text-zkachi-text-secondary font-light leading-relaxed max-w-lg text-center lg:text-left"
      >
        Spin the wheel and verify the outcome yourself. ZK proofs guarantee true randomness — no trust required, just math.
      </motion.p>

      <motion.p
        custom={3}
        variants={fadeUp}
        className="font-dm-sans italic text-zkachi-gold opacity-80 text-sm"
      >
        bet private, win public
      </motion.p>

      <motion.div custom={4} variants={fadeUp} className="flex gap-4">
        <Link to="/app/game" className="bg-secondary text-secondary-foreground font-semibold px-7 py-3 rounded-xl hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-zkachi-gold/20 hover:shadow-zkachi-gold/30">
          Spin Now
        </Link>
        <Link to="/app/verify" className="bg-transparent border border-zkachi-border text-zkachi-text-secondary px-7 py-3 rounded-xl hover:border-zkachi-text-muted hover:text-foreground transition-all duration-200">
          Verify Fairness
        </Link>
      </motion.div>

      <motion.div
        custom={5}
        variants={fadeUp}
        className="flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-zkachi-green animate-pulse-green" />
        <span className="font-space text-xs text-zkachi-text-muted">
          Last proof verified 12s ago · Block #18,432,091
        </span>
      </motion.div>
    </motion.div>
  );
};

export default HeroMessage;
