use soroban_sdk::{contracttype, Address, BytesN};

/// Bet types available in European roulette.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum BetType {
    Straight(u32), // Exact number (0-36) → pays 35:1
    Red,           // Red numbers → pays 1:1
    Black,         // Black numbers → pays 1:1
    Even,          // Even (2,4,6...) → pays 1:1
    Odd,           // Odd (1,3,5...) → pays 1:1
    Low,           // 1-18 → pays 1:1
    High,          // 19-36 → pays 1:1
    Dozen(u32),    // 1=1-12, 2=13-24, 3=25-36 → pays 2:1
}

/// Status of a roulette round.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum RoundStatus {
    Open,      // Cranker committed, waiting for bet
    BetPlaced, // Player bet placed, waiting for reveal
    Settled,   // Round resolved
    TimedOut,  // Cranker didn't reveal in time
}

/// A roulette round.
/// Note: Soroban contracttype doesn't support Option directly.
/// We use RoundStatus to determine if bet/result are set.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Round {
    pub id: u64,
    pub cranker: Address,
    pub commit: BytesN<32>,
    pub bond: i128,
    pub status: RoundStatus,
    pub commit_ledger: u32,
    pub result: u32, // 0 is valid (green), use status to check if set
}

/// Stored separately from Round to avoid Option in contracttype.
#[contracttype]
#[derive(Clone, Debug)]
pub struct StoredBet {
    pub player: Address,
    pub bet_type: BetType,
    pub amount: i128,
    pub seed_player: BytesN<32>,
}

/// Result of settlement computation.
#[derive(Clone, Debug)]
pub struct SettlementResult {
    pub player_won: bool,
    pub payout: i128,      // Amount player receives from pool (0 if lost)
    pub pool_absorb: i128, // Amount pool absorbs (0 if player won)
    pub cranker_fee: i128, // Fee paid to cranker from absorbed amount
}

/// Groth16 verification keys — static const, not stored on-chain.
/// Following xray-games pattern.
pub struct VerificationKeys {
    pub alpha: [u8; 64],
    pub beta: [u8; 128],
    pub gamma: [u8; 128],
    pub delta: [u8; 128],
    pub ic: &'static [[u8; 64]],
}
