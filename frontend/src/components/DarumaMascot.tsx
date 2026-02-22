const DarumaMascot = () => {
  return (
    <div className="flex items-center justify-center relative">
      {/* Pulsing gold glow */}
      <div className="absolute w-[280px] h-[280px] rounded-full animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(42, 60%, 55%, 0.25) 0%, transparent 70%)',
        }}
      />

      {/* Floating Daruma */}
      <div className="animate-float-daruma relative">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dashed ring */}
          <circle cx="100" cy="105" r="90" stroke="#D4A843" strokeWidth="0.5" strokeDasharray="6 4" opacity="0.15" />

          {/* Body */}
          <ellipse cx="100" cy="110" rx="72" ry="80" fill="#14121E" stroke="#D4A843" strokeWidth="2" />

          {/* Inner face area */}
          <ellipse cx="100" cy="90" rx="48" ry="40" fill="#1E1A2E" opacity="0.6" />

          {/* Left eyebrow (gold) */}
          <path d="M65 72 Q78 64 90 72" stroke="#D4A843" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Right eyebrow (purple) */}
          <path d="M110 72 Q122 64 135 72" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Left eye - gold (public/visible) */}
          <circle cx="78" cy="88" r="14" fill="#D4A843" />
          <circle cx="78" cy="88" r="8" fill="#14121E" />
          <circle cx="74" cy="84" r="4" fill="white" opacity="0.8" />

          {/* Right eye - ZK (private/hidden) */}
          <circle cx="122" cy="88" r="14" fill="#8B5CF6" />
          <text x="122" y="93" fontSize="12" fill="white" fontFamily="'Space Mono', monospace" textAnchor="middle" fontWeight="bold">ZK</text>
          {/* Glitch rectangles */}
          <rect x="112" y="79" width="4" height="2" fill="#8B5CF6" opacity="0.5" />
          <rect x="130" y="85" width="3" height="2" fill="#8B5CF6" opacity="0.4" />
          <rect x="115" y="95" width="5" height="1.5" fill="#D4A843" opacity="0.3" />
          <rect x="128" y="92" width="2" height="3" fill="#8B5CF6" opacity="0.6" />

          {/* Smile */}
          <path d="M88 108 Q100 118 112 108" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Kanji 勝 (victory) */}
          <text x="100" y="155" fontSize="24" fill="#D4A843" fontFamily="serif" textAnchor="middle" opacity="0.1">勝</text>
        </svg>
      </div>
    </div>
  );
};

export default DarumaMascot;
