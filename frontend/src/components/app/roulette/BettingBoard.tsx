import { BOARD_ROWS, RED_NUMBERS, type BetType } from "./constants";

interface Props {
  selectedBet: BetType | null;
  onSelectBet: (bet: BetType) => void;
  disabled: boolean;
}

function isBetEqual(a: BetType | null, b: BetType): boolean {
  if (!a) return false;
  if (a.kind !== b.kind) return false;
  if (a.kind === "straight" && b.kind === "straight") return a.number === b.number;
  if (a.kind === "dozen" && b.kind === "dozen") return a.group === b.group;
  if (a.kind === "half" && b.kind === "half") return a.half === b.half;
  if (a.kind === "parity" && b.kind === "parity") return a.parity === b.parity;
  if (a.kind === "color" && b.kind === "color") return a.color === b.color;
  return false;
}

const Cell = ({
  label,
  bet,
  selected,
  onClick,
  className = "",
  disabled,
}: {
  label: string;
  bet: BetType;
  selected: boolean;
  onClick: () => void;
  className?: string;
  disabled: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      min-h-[40px] rounded-lg font-space font-bold text-[13px] text-foreground
      transition-all duration-150 cursor-pointer
      ${disabled ? "opacity-50 cursor-not-allowed" : "hover:brightness-125"}
      ${selected ? "ring-2 ring-zkachi-gold shadow-[0_0_12px_hsl(42,60%,55%,0.3)]" : ""}
      ${className}
    `}
  >
    {label}
  </button>
);

const BettingBoard = ({ selectedBet, onSelectBet, disabled }: Props) => {
  const isRed = (n: number) => RED_NUMBERS.includes(n);

  return (
    <div className="w-full">
      <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-3">
        Betting Board
      </span>

      <div className="bg-card border border-border rounded-2xl p-4 overflow-x-auto">
        {/* Zero */}
        <Cell
          label="0"
          bet={{ kind: "straight", number: 0 }}
          selected={isBetEqual(selectedBet, { kind: "straight", number: 0 })}
          onClick={() => onSelectBet({ kind: "straight", number: 0 })}
          className="w-full bg-zkachi-green/80 mb-2"
          disabled={disabled}
        />

        {/* Number grid — 3 rows × 12 cols */}
        <div className="grid grid-rows-3 gap-1 mb-2">
          {BOARD_ROWS.map((row, ri) => (
            <div key={ri} className="grid grid-cols-12 gap-1">
              {row.map((n) => (
                <Cell
                  key={n}
                  label={String(n)}
                  bet={{ kind: "straight", number: n }}
                  selected={isBetEqual(selectedBet, { kind: "straight", number: n })}
                  onClick={() => onSelectBet({ kind: "straight", number: n })}
                  className={isRed(n) ? "bg-zkachi-red/80" : "bg-border"}
                  disabled={disabled}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Dozens */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          {([1, 2, 3] as const).map((g) => (
            <Cell
              key={g}
              label={`${g === 1 ? "1st" : g === 2 ? "2nd" : "3rd"} 12`}
              bet={{ kind: "dozen", group: g }}
              selected={isBetEqual(selectedBet, { kind: "dozen", group: g })}
              onClick={() => onSelectBet({ kind: "dozen", group: g })}
              className="bg-border"
              disabled={disabled}
            />
          ))}
        </div>

        {/* Even-money bets */}
        <div className="grid grid-cols-6 gap-1">
          <Cell label="1-18" bet={{ kind: "half", half: "1-18" }} selected={isBetEqual(selectedBet, { kind: "half", half: "1-18" })} onClick={() => onSelectBet({ kind: "half", half: "1-18" })} className="bg-border" disabled={disabled} />
          <Cell label="Even" bet={{ kind: "parity", parity: "even" }} selected={isBetEqual(selectedBet, { kind: "parity", parity: "even" })} onClick={() => onSelectBet({ kind: "parity", parity: "even" })} className="bg-border" disabled={disabled} />
          <Cell label="Red" bet={{ kind: "color", color: "red" }} selected={isBetEqual(selectedBet, { kind: "color", color: "red" })} onClick={() => onSelectBet({ kind: "color", color: "red" })} className="bg-zkachi-red/80" disabled={disabled} />
          <Cell label="Black" bet={{ kind: "color", color: "black" }} selected={isBetEqual(selectedBet, { kind: "color", color: "black" })} onClick={() => onSelectBet({ kind: "color", color: "black" })} className="bg-border" disabled={disabled} />
          <Cell label="Odd" bet={{ kind: "parity", parity: "odd" }} selected={isBetEqual(selectedBet, { kind: "parity", parity: "odd" })} onClick={() => onSelectBet({ kind: "parity", parity: "odd" })} className="bg-border" disabled={disabled} />
          <Cell label="19-36" bet={{ kind: "half", half: "19-36" }} selected={isBetEqual(selectedBet, { kind: "half", half: "19-36" })} onClick={() => onSelectBet({ kind: "half", half: "19-36" })} className="bg-border" disabled={disabled} />
        </div>
      </div>
    </div>
  );
};

export default BettingBoard;
