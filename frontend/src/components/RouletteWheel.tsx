import { useState, useEffect, useCallback } from "react";

const EUROPEAN_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

const getColor = (n: number) => {
  if (n === 0) return "#22c55e99";
  if (RED_NUMBERS.has(n)) return "#991B1Bb3";
  return "#1a1a2e";
};

const getColorLabel = (n: number) => {
  if (n === 0) return "GREEN";
  if (RED_NUMBERS.has(n)) return "RED";
  return "BLACK";
};

const getColorHex = (n: number) => {
  if (n === 0) return "#22c55e";
  if (RED_NUMBERS.has(n)) return "#991B1B";
  return "#E8E6F0";
};

const segmentAngle = 360 / 37;

const WIN_AMOUNTS = ["$20", "$80", "$150", "$500", "$1,250", "$3,400", "$50", "$200", "$750"];

interface FloatingBubble {
  id: number;
  amount: string;
  x: number;
  y: number;
  driftX: number;
  delay: number;
  big: boolean;
}

const BallVisual = () => (
  <div
    className="w-[10px] h-[10px] rounded-full -translate-x-1/2 -translate-y-1/2"
    style={{
      background: "radial-gradient(circle at 35% 35%, white 0%, #c0c0c0 50%, #808080 100%)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(0,0,0,0.2)",
    }}
  >
    <div className="w-[3px] h-[3px] rounded-full bg-white/80 absolute top-[1px] left-[2px]" />
  </div>
);

const RouletteWheel = () => {
  const [landed, setLanded] = useState(false);
  const [winNumber, setWinNumber] = useState<number | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const [spinKey, setSpinKey] = useState(0);

  const spawnBubbles = useCallback(() => {
    const count = 3 + Math.floor(Math.random() * 3);
    const newBubbles: FloatingBubble[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 160 + Math.random() * 40;
      newBubbles.push({
        id: Date.now() + i,
        amount: "+" + WIN_AMOUNTS[Math.floor(Math.random() * WIN_AMOUNTS.length)],
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        driftX: (Math.random() - 0.5) * 40,
        delay: i * 0.15,
        big: Math.random() > 0.7,
      });
    }
    setBubbles(newBubbles);
  }, []);

  useEffect(() => {
    // Ball animation takes ~5.5s to settle, then we show the result
    const SPIN_DURATION = 5500;
    const SHOW_DURATION = 2500;
    const TOTAL_CYCLE = SPIN_DURATION + SHOW_DURATION;

    const runCycle = () => {
      // Ball is already spinning (animation started on mount/key change)
      // After spin duration, ball has settled — show the result
      const landTimeout = setTimeout(() => {
        const nums = [17, 23, 0, 32, 5, 14, 36, 8, 1, 19, 7, 30];
        const num = nums[Math.floor(Math.random() * nums.length)];
        setWinNumber(num);
        setLanded(true);
        setShowWin(true);
        spawnBubbles();
      }, SPIN_DURATION);

      // After showing result, hide it and restart the ball
      const resetTimeout = setTimeout(() => {
        setShowWin(false);
        setBubbles([]);
        setLanded(false);
        setSpinKey((k) => k + 1); // remount ball to restart animation
      }, TOTAL_CYCLE);

      return [landTimeout, resetTimeout];
    };

    const timeouts = runCycle();
    const interval = setInterval(() => {
      runCycle();
    }, TOTAL_CYCLE);

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [spawnBubbles]);

  return (
    <div className="flex flex-col items-center gap-4 relative">
      {/* Winning number display */}
      <div className="h-24 flex flex-col items-center justify-end">
        {showWin && winNumber !== null && (
          <div className="flex flex-col items-center animate-fade-in">
            <span
              className="text-6xl font-extrabold text-zkachi-gold"
              style={{
                textShadow: "0 0 30px hsla(42,60%,55%,0.5), 0 0 60px hsla(42,60%,55%,0.2)",
              }}
            >
              {winNumber}
            </span>
            <span
              className="text-sm font-bold font-space tracking-wider mt-1"
              style={{ color: getColorHex(winNumber) }}
            >
              {getColorLabel(winNumber)}
            </span>
          </div>
        )}
      </div>

      {/* 3D Wheel container */}
      <div className="relative" style={{ perspective: "800px" }}>
        <div
          className="relative w-[380px] h-[380px] lg:w-[400px] lg:h-[400px]"
          style={{ transform: "rotateX(25deg)" }}
        >
          {/* Gold pointer at top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "14px solid #D4A843",
                filter: "drop-shadow(0 2px 4px rgba(212,168,67,0.4))",
              }}
            />
          </div>

          {/* Outer rim */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, #1E1A2E 0%, #332A58 30%, #1E1A2E 70%, #14121E 100%)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2 bg-zkachi-gold rotate-45"
                style={{
                  top: `${50 - 47 * Math.cos((deg * Math.PI) / 180)}%`,
                  left: `${50 + 47 * Math.sin((deg * Math.PI) / 180)}%`,
                  transform: "translate(-50%, -50%) rotate(45deg)",
                }}
              />
            ))}
          </div>

          {/* Spinning number ring */}
          <div className="absolute inset-[14px] rounded-full animate-wheel-spin">
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {EUROPEAN_NUMBERS.map((num, i) => {
                const startAngle = i * segmentAngle - 90;
                const endAngle = startAngle + segmentAngle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const outerR = 150;
                const innerR = 80;
                const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;

                const x1 = 150 + outerR * Math.cos(startRad);
                const y1 = 150 + outerR * Math.sin(startRad);
                const x2 = 150 + outerR * Math.cos(endRad);
                const y2 = 150 + outerR * Math.sin(endRad);
                const x3 = 150 + innerR * Math.cos(endRad);
                const y3 = 150 + innerR * Math.sin(endRad);
                const x4 = 150 + innerR * Math.cos(startRad);
                const y4 = 150 + innerR * Math.sin(startRad);

                const textR = 120;
                const tx = 150 + textR * Math.cos(midAngle);
                const ty = 150 + textR * Math.sin(midAngle);
                const textRotation = (startAngle + endAngle) / 2 + 90;

                return (
                  <g key={num}>
                    <path
                      d={`M${x1},${y1} A${outerR},${outerR} 0 0,1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 0,0 ${x4},${y4} Z`}
                      fill={getColor(num)}
                      stroke="#D4A843"
                      strokeWidth="0.5"
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill="rgba(255,255,255,0.85)"
                      fontSize="8"
                      fontFamily="'Space Mono', monospace"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                    >
                      {num}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* Landed ball — sits on the winning number and rotates with the wheel */}
            {landed && winNumber !== null && (() => {
              const winIndex = EUROPEAN_NUMBERS.indexOf(winNumber);
              const angleDeg = winIndex * segmentAngle + segmentAngle / 2 - 90;
              return (
                <div
                  className="absolute z-20"
                  style={{
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    transform: `rotate(${angleDeg}deg) translateX(140px)`,
                  }}
                >
                  <BallVisual />
                </div>
              );
            })()}
          </div>

          {/* Inner bowl */}
          <div
            className="absolute inset-[90px] rounded-full animate-wheel-spin"
            style={{
              background: "radial-gradient(circle, #14121E 40%, #1E1A2E 100%)",
              boxShadow: "inset 0 4px 12px rgba(0,0,0,0.6)",
            }}
          >
            <div className="absolute inset-2 rounded-full border border-zkachi-purple/10" />
            <div className="absolute inset-4 rounded-full border border-zkachi-purple/5" />
          </div>

          {/* Center hub */}
          <div className="absolute inset-[120px] rounded-full flex items-center justify-center z-10">
            <div className="animate-counter-spin w-full h-full rounded-full bg-background border-2 border-zkachi-gold/60 flex items-center justify-center shadow-lg">
              <span className="font-space font-bold text-zkachi-purple text-sm">ZK</span>
            </div>
          </div>

          {/* Orbiting ball — hidden when landed */}
          {!landed && (
            <div
              key={spinKey}
              className="absolute inset-0 z-20"
              style={{
                top: '50%', left: '50%', width: 0, height: 0,
                animation: 'ball-orbit 5.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
              }}
            >
              <BallVisual />
            </div>
          )}
        </div>

        {/* Floating win bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute pointer-events-none"
            style={{
              left: `calc(50% + ${b.x}px)`,
              top: `calc(50% + ${b.y}px)`,
              animation: `floatBubble 2s ease-out ${b.delay}s both`,
              transform: `translateX(${b.driftX}px)`,
            }}
          >
            <span
              className={`font-space font-bold ${b.big ? 'text-base' : 'text-sm'} text-zkachi-gold`}
              style={{
                textShadow: b.big
                  ? "0 0 12px hsla(42,60%,55%,0.6)"
                  : "0 0 8px hsla(42,60%,55%,0.3)",
              }}
            >
              {b.amount}
            </span>
          </div>
        ))}
      </div>

      {/* Verification badge */}
      <div className="glass-morphism rounded-xl px-5 py-2.5 flex items-center gap-3 border border-zkachi-purple/20">
        <span className={`transition-colors duration-300 ${landed ? 'text-zkachi-green' : 'text-zkachi-green/60'}`}>✓</span>
        <span className="font-space text-xs text-zkachi-text-secondary">
          proof: verified · spin #4,291
        </span>
        {landed && winNumber !== null && (
          <span className="font-space text-xs text-foreground animate-fade-in ml-1">
            → {winNumber} {getColorLabel(winNumber)}
          </span>
        )}
      </div>
    </div>
  );
};

export default RouletteWheel;
