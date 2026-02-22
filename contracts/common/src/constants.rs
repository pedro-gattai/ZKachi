/// Red numbers on a European roulette wheel.
pub const RED_NUMBERS: [u32; 18] = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

/// Timeout in ledgers (~8 minutes on Stellar, ~5s per ledger).
pub const TIMEOUT_LEDGERS: u32 = 100;

/// Minimum cranker bond (in stroops: 50 XLM = 500_000_000 stroops).
pub const MIN_BOND: i128 = 500_000_000;

/// Cranker fee in basis points (10% = 1000 bps).
pub const CRANKER_FEE_BPS: u32 = 1000;

/// Max bet as ratio of pool balance in basis points (2% = 200 bps).
pub const MAX_BET_RATIO_BPS: u32 = 200;

/// Basis points denominator.
pub const BPS_DENOMINATOR: u32 = 10_000;

/// Payout multipliers (including original bet returned).
/// Straight: pays 35:1 → total return = 36x bet
pub const PAYOUT_STRAIGHT: i128 = 36;
/// Even money bets (Red/Black/Even/Odd/Low/High): pays 1:1 → total return = 2x bet
pub const PAYOUT_EVEN_MONEY: i128 = 2;
/// Dozen: pays 2:1 → total return = 3x bet
pub const PAYOUT_DOZEN: i128 = 3;

/// TTL for temporary storage (game data) — ~30 days.
pub const GAME_TTL_LEDGERS: u32 = 518_400;

/// Number of public inputs in the ZK circuit.
pub const ZK_PUBLIC_INPUTS: usize = 4;
