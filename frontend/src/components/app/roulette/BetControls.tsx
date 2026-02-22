import { CHIP_VALUES, type BetType, betLabel } from "./constants";

interface Props {
  selectedBet: BetType | null;
  amount: number;
  onAmountChange: (amount: number) => void;
  onPlaceBet: () => void;
  disabled: boolean;
  placedLabel?: string;
  maxBet?: number;
}

const BetControls = ({ selectedBet, amount, onAmountChange, onPlaceBet, disabled, placedLabel, maxBet }: Props) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mt-4">
      <span className="block font-space text-[9px] tracking-[2px] uppercase text-muted-foreground mb-3">
        Your Bet
      </span>

      {/* Selected bet */}
      <div className="mb-4">
        <span className="text-sm font-bold text-foreground">
          {selectedBet ? betLabel(selectedBet) : "No bet selected"}
        </span>
      </div>

      {/* Amount input */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => onAmountChange(Math.max(1, amount - 10))}
          className="w-8 h-8 rounded-lg bg-border text-foreground font-bold text-sm flex items-center justify-center hover:brightness-125 transition-all"
        >
          −
        </button>
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(Math.max(1, Number(e.target.value)))}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-center font-space text-sm text-foreground outline-none focus:ring-1 focus:ring-zkachi-gold/50"
        />
        <button
          onClick={() => onAmountChange(amount + 10)}
          className="w-8 h-8 rounded-lg bg-border text-foreground font-bold text-sm flex items-center justify-center hover:brightness-125 transition-all"
        >
          +
        </button>
        <span className="font-space text-[10px] text-muted-foreground uppercase">XLM</span>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CHIP_VALUES.map((v) => (
          <button
            key={v}
            onClick={() => onAmountChange(v)}
            className={`rounded-full px-3 py-1 font-space text-[10px] border transition-all ${
              amount === v
                ? "border-zkachi-gold text-zkachi-gold bg-zkachi-gold/10"
                : "border-border text-muted-foreground bg-card hover:border-muted-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="font-space text-[10px] text-muted-foreground">Max: {maxBet ? `${Math.floor(maxBet).toLocaleString()} XLM` : "—"}</span>
      </div>

      {/* Place bet button */}
      <button
        onClick={onPlaceBet}
        disabled={disabled || !selectedBet}
        className={`w-full font-space font-bold text-[10px] tracking-[1.5px] uppercase px-6 py-3 rounded-lg transition-all ${
          disabled || !selectedBet
            ? "bg-border text-muted-foreground cursor-not-allowed"
            : "bg-secondary text-secondary-foreground hover:opacity-90 shadow-lg shadow-zkachi-gold/20"
        }`}
      >
        {placedLabel || "Place Bet"}
      </button>
    </div>
  );
};

export default BetControls;
