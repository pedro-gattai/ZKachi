const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-5">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3">
          {/* Small Daruma */}
          <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="110" rx="72" ry="80" fill="#14121E" stroke="#D4A843" strokeWidth="2" />
            <ellipse cx="100" cy="90" rx="48" ry="40" fill="#1E1A2E" opacity="0.6" />
            <path d="M65 72 Q78 64 90 72" stroke="#D4A843" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M110 72 Q122 64 135 72" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="78" cy="88" r="14" fill="#D4A843" />
            <circle cx="78" cy="88" r="8" fill="#14121E" />
            <circle cx="74" cy="84" r="4" fill="white" opacity="0.8" />
            <circle cx="122" cy="88" r="14" fill="#8B5CF6" />
            <text x="122" y="93" fontSize="12" fill="white" fontFamily="'Space Mono', monospace" textAnchor="middle" fontWeight="bold">ZK</text>
            <path d="M88 108 Q100 118 112 108" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" fill="none" />
            <text x="100" y="155" fontSize="24" fill="#D4A843" fontFamily="serif" textAnchor="middle" opacity="0.1">勝</text>
          </svg>
          <span className="text-xl font-bold">
            <span className="text-foreground">ZK</span>
            <span className="text-zkachi-gold">achi</span>
          </span>
        </div>

        {/* Tagline */}
        <p className="font-dm-sans italic text-zkachi-gold/60 text-sm">
          bet private, win public
        </p>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/pedro-gattai/ZKachi"
            target="_blank"
            rel="noopener noreferrer"
            className="font-space text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="/app/docs"
            className="font-space text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </a>
        </div>

        {/* Bottom line */}
        <span className="font-space text-[9px] text-muted-foreground/50 tracking-wide">
          Built for ZK Gaming on Stellar Hackathon 2026
        </span>
      </div>
    </footer>
  );
};

export default Footer;
