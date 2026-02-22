use common::constants::{
    BPS_DENOMINATOR, CRANKER_FEE_BPS, PAYOUT_DOZEN, PAYOUT_EVEN_MONEY, PAYOUT_STRAIGHT, RED_NUMBERS,
};
use common::types::{BetType, SettlementResult};

/// Check if a roulette number is red.
pub fn is_red(n: u32) -> bool {
    RED_NUMBERS.contains(&n)
}

/// Compute the settlement for a given result and bet.
/// Returns payout to player (from pool), amount for pool to absorb, and cranker fee.
pub fn compute_settlement(resultado: u32, bet_type: &BetType, amount: i128) -> SettlementResult {
    let won = check_win(resultado, bet_type);

    if won {
        let multiplier = get_multiplier(bet_type);
        // Payout from pool = (multiplier - 1) * amount
        // Player also gets their original bet back (held in escrow by roulette contract)
        let pool_payout = (multiplier - 1) * amount;
        SettlementResult {
            player_won: true,
            payout: pool_payout,
            pool_absorb: 0,
            cranker_fee: 0,
        }
    } else {
        // Player loses: pool absorbs the bet, cranker gets a cut
        let cranker_fee = amount * (CRANKER_FEE_BPS as i128) / (BPS_DENOMINATOR as i128);
        let pool_amount = amount - cranker_fee;
        SettlementResult {
            player_won: false,
            payout: 0,
            pool_absorb: pool_amount,
            cranker_fee,
        }
    }
}

/// Check if a bet wins given the resultado.
fn check_win(resultado: u32, bet_type: &BetType) -> bool {
    match bet_type {
        BetType::Straight(n) => resultado == *n,
        BetType::Red => resultado > 0 && is_red(resultado),
        BetType::Black => resultado > 0 && !is_red(resultado),
        BetType::Even => resultado > 0 && resultado % 2 == 0,
        BetType::Odd => resultado > 0 && resultado % 2 == 1,
        BetType::Low => resultado >= 1 && resultado <= 18,
        BetType::High => resultado >= 19 && resultado <= 36,
        BetType::Dozen(d) => match d {
            1 => resultado >= 1 && resultado <= 12,
            2 => resultado >= 13 && resultado <= 24,
            3 => resultado >= 25 && resultado <= 36,
            _ => false,
        },
    }
}

/// Get the total return multiplier for a bet type.
fn get_multiplier(bet_type: &BetType) -> i128 {
    match bet_type {
        BetType::Straight(_) => PAYOUT_STRAIGHT,
        BetType::Red
        | BetType::Black
        | BetType::Even
        | BetType::Odd
        | BetType::Low
        | BetType::High => PAYOUT_EVEN_MONEY,
        BetType::Dozen(_) => PAYOUT_DOZEN,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_red() {
        assert!(is_red(1));
        assert!(is_red(3));
        assert!(is_red(36));
        assert!(!is_red(0));
        assert!(!is_red(2));
        assert!(!is_red(4));
    }

    #[test]
    fn test_straight_win() {
        let result = compute_settlement(7, &BetType::Straight(7), 1000);
        assert!(result.player_won);
        assert_eq!(result.payout, 35_000); // (36-1) * 1000
        assert_eq!(result.pool_absorb, 0);
    }

    #[test]
    fn test_straight_lose() {
        let result = compute_settlement(8, &BetType::Straight(7), 1000);
        assert!(!result.player_won);
        assert_eq!(result.payout, 0);
        assert_eq!(result.cranker_fee, 100); // 10% of 1000
        assert_eq!(result.pool_absorb, 900); // 90% of 1000
    }

    #[test]
    fn test_red_win() {
        let result = compute_settlement(1, &BetType::Red, 1000);
        assert!(result.player_won);
        assert_eq!(result.payout, 1000); // (2-1) * 1000
    }

    #[test]
    fn test_red_lose_on_black() {
        let result = compute_settlement(2, &BetType::Red, 1000);
        assert!(!result.player_won);
    }

    #[test]
    fn test_red_lose_on_zero() {
        // Zero is neither red nor black — house edge
        let result = compute_settlement(0, &BetType::Red, 1000);
        assert!(!result.player_won);
    }

    #[test]
    fn test_black_win() {
        let result = compute_settlement(2, &BetType::Black, 1000);
        assert!(result.player_won);
    }

    #[test]
    fn test_even_win() {
        let result = compute_settlement(4, &BetType::Even, 1000);
        assert!(result.player_won);
    }

    #[test]
    fn test_even_lose_on_zero() {
        let result = compute_settlement(0, &BetType::Even, 1000);
        assert!(!result.player_won);
    }

    #[test]
    fn test_odd_win() {
        let result = compute_settlement(7, &BetType::Odd, 1000);
        assert!(result.player_won);
    }

    #[test]
    fn test_low_win() {
        let result = compute_settlement(1, &BetType::Low, 1000);
        assert!(result.player_won);
        let result = compute_settlement(18, &BetType::Low, 1000);
        assert!(result.player_won);
    }

    #[test]
    fn test_low_lose() {
        let result = compute_settlement(19, &BetType::Low, 1000);
        assert!(!result.player_won);
        let result = compute_settlement(0, &BetType::Low, 1000);
        assert!(!result.player_won);
    }

    #[test]
    fn test_high_win() {
        let result = compute_settlement(19, &BetType::High, 1000);
        assert!(result.player_won);
        let result = compute_settlement(36, &BetType::High, 1000);
        assert!(result.player_won);
    }

    #[test]
    fn test_dozen_1() {
        let result = compute_settlement(1, &BetType::Dozen(1), 1000);
        assert!(result.player_won);
        assert_eq!(result.payout, 2000); // (3-1) * 1000

        let result = compute_settlement(12, &BetType::Dozen(1), 1000);
        assert!(result.player_won);

        let result = compute_settlement(13, &BetType::Dozen(1), 1000);
        assert!(!result.player_won);
    }

    #[test]
    fn test_dozen_2() {
        let result = compute_settlement(13, &BetType::Dozen(2), 1000);
        assert!(result.player_won);
        let result = compute_settlement(24, &BetType::Dozen(2), 1000);
        assert!(result.player_won);
    }

    #[test]
    fn test_dozen_3() {
        let result = compute_settlement(25, &BetType::Dozen(3), 1000);
        assert!(result.player_won);
        let result = compute_settlement(36, &BetType::Dozen(3), 1000);
        assert!(result.player_won);
    }
}
