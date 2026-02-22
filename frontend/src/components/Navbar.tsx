import { Link } from "react-router-dom";

const stats = [
  { value: "$2.4M", color: "text-secondary", label: "wagered" },
  { value: "14,832", color: "text-primary", label: "proofs" },
  { value: "100%", color: "text-foreground", label: "verifiable" },
  { value: "3,291", color: "text-foreground", label: "players" },
];

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-zkachi/50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Wordmark */}
        <span className="font-bold text-lg shrink-0">
          <span className="text-foreground">ZK</span>
          <span className="text-secondary">achi</span>
        </span>

        {/* Center: Compact Stats */}
        <div className="hidden lg:flex items-center gap-0">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div className="w-px h-5 bg-border mx-4" />
              )}
              <div className="flex items-baseline gap-1.5">
                <span className={`font-bold text-sm ${stat.color}`}>{stat.value}</span>
                <span className="font-space text-[10px] tracking-wider uppercase text-muted-foreground">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: 2 key stats */}
        <div className="flex lg:hidden items-center gap-0">
          {stats.slice(0, 2).map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && <div className="w-px h-4 bg-border mx-3" />}
              <div className="flex items-baseline gap-1">
                <span className={`font-bold text-xs ${stat.color}`}>{stat.value}</span>
                <span className="font-space text-[8px] tracking-wider uppercase text-muted-foreground">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Links + CTA */}
        <div className="flex items-center shrink-0">
          <Link
            to="/app"
            className="bg-primary text-primary-foreground font-space text-xs tracking-wider uppercase px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
