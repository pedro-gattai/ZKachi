export const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export const BOARD_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

export type BetType =
  | { kind: "straight"; number: number }
  | { kind: "dozen"; group: 1 | 2 | 3 }
  | { kind: "half"; half: "1-18" | "19-36" }
  | { kind: "parity"; parity: "even" | "odd" }
  | { kind: "color"; color: "red" | "black" };

export type GamePhase = "WAITING" | "OPEN" | "REVEALING" | "SETTLED";

export interface RoundResult {
  roundNumber: number;
  result: number;
  won: boolean;
  amount: number;
  betLabel: string;
}

export function isRed(n: number): boolean {
  return RED_NUMBERS.includes(n);
}

export function getNumberColor(n: number): "green" | "red" | "black" {
  if (n === 0) return "green";
  return isRed(n) ? "red" : "black";
}

export function betLabel(bet: BetType): string {
  switch (bet.kind) {
    case "straight": return `Straight ${bet.number}`;
    case "dozen": return `Dozen ${bet.group === 1 ? "1-12" : bet.group === 2 ? "13-24" : "25-36"}`;
    case "half": return bet.half;
    case "parity": return bet.parity === "even" ? "Even" : "Odd";
    case "color": return bet.color === "red" ? "Red" : "Black";
  }
}

export function evaluateBet(bet: BetType, result: number): { won: boolean; multiplier: number } {
  if (result === 0) return { won: bet.kind === "straight" && bet.number === 0, multiplier: 36 };

  switch (bet.kind) {
    case "straight":
      return { won: bet.number === result, multiplier: 36 };
    case "dozen": {
      const group = bet.group;
      const inRange =
        group === 1 ? result >= 1 && result <= 12 :
        group === 2 ? result >= 13 && result <= 24 :
        result >= 25 && result <= 36;
      return { won: inRange, multiplier: 3 };
    }
    case "half":
      return { won: bet.half === "1-18" ? result <= 18 : result >= 19, multiplier: 2 };
    case "parity":
      return { won: bet.parity === "even" ? result % 2 === 0 : result % 2 === 1, multiplier: 2 };
    case "color":
      return { won: bet.color === (isRed(result) ? "red" : "black"), multiplier: 2 };
  }
}

export const CHIP_VALUES = [10, 25, 50, 100, 500];
