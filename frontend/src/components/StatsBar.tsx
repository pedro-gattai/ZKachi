const stats = [
  { value: "$2.4M", color: "text-zkachi-gold", label: "TOTAL WAGERED" },
  { value: "14,832", color: "text-zkachi-purple", label: "ZK PROOFS" },
  { value: "100%", color: "text-foreground", label: "VERIFIABLE" },
  { value: "3,291", color: "text-foreground", label: "PLAYERS" },
];

const StatsBar = () => {
  return (
    <div className="glass-morphism rounded-xl px-8 py-3.5 flex items-center gap-8 flex-wrap justify-center">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-0.5">
          <span className={`font-bold text-lg ${stat.color}`}>{stat.value}</span>
          <span className="font-space text-[8px] tracking-wider uppercase text-zkachi-text-muted">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
