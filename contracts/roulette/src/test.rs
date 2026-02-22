use crate::settlement::{compute_settlement, is_red};
use common::types::BetType;

#[test]
fn test_settlement_all_bet_types_win() {
    // Straight win on number 7
    let r = compute_settlement(7, &BetType::Straight(7), 1000);
    assert!(r.player_won);
    assert_eq!(r.payout, 35_000);

    // Red win (1 is red)
    let r = compute_settlement(1, &BetType::Red, 1000);
    assert!(r.player_won);
    assert_eq!(r.payout, 1_000);

    // Black win (2 is black)
    let r = compute_settlement(2, &BetType::Black, 1000);
    assert!(r.player_won);
    assert_eq!(r.payout, 1_000);

    // Even win
    let r = compute_settlement(4, &BetType::Even, 1000);
    assert!(r.player_won);

    // Odd win
    let r = compute_settlement(7, &BetType::Odd, 1000);
    assert!(r.player_won);

    // Low win
    let r = compute_settlement(5, &BetType::Low, 1000);
    assert!(r.player_won);

    // High win
    let r = compute_settlement(25, &BetType::High, 1000);
    assert!(r.player_won);

    // Dozen 1 win
    let r = compute_settlement(5, &BetType::Dozen(1), 1000);
    assert!(r.player_won);
    assert_eq!(r.payout, 2_000);

    // Dozen 2 win
    let r = compute_settlement(15, &BetType::Dozen(2), 1000);
    assert!(r.player_won);

    // Dozen 3 win
    let r = compute_settlement(30, &BetType::Dozen(3), 1000);
    assert!(r.player_won);
}

#[test]
fn test_settlement_all_bet_types_lose() {
    // Straight miss
    let r = compute_settlement(8, &BetType::Straight(7), 1000);
    assert!(!r.player_won);
    assert_eq!(r.cranker_fee, 100);
    assert_eq!(r.pool_absorb, 900);

    // Red loses on black
    let r = compute_settlement(2, &BetType::Red, 1000);
    assert!(!r.player_won);

    // Black loses on red
    let r = compute_settlement(1, &BetType::Black, 1000);
    assert!(!r.player_won);

    // Even loses on odd
    let r = compute_settlement(7, &BetType::Even, 1000);
    assert!(!r.player_won);

    // Odd loses on even
    let r = compute_settlement(4, &BetType::Odd, 1000);
    assert!(!r.player_won);

    // Low loses on high
    let r = compute_settlement(25, &BetType::Low, 1000);
    assert!(!r.player_won);

    // High loses on low
    let r = compute_settlement(5, &BetType::High, 1000);
    assert!(!r.player_won);
}

#[test]
fn test_zero_loses_all_even_money_bets() {
    // Zero is the house edge — all even money bets lose
    let bets = [
        BetType::Red,
        BetType::Black,
        BetType::Even,
        BetType::Odd,
        BetType::Low,
        BetType::High,
    ];
    for bet in bets.iter() {
        let r = compute_settlement(0, bet, 1000);
        assert!(!r.player_won, "zero should lose for {:?}", bet);
    }
}

#[test]
fn test_cranker_fee_calculation() {
    // On a loss: 10% goes to cranker, 90% to pool
    let r = compute_settlement(0, &BetType::Red, 10_000);
    assert!(!r.player_won);
    assert_eq!(r.cranker_fee, 1_000);
    assert_eq!(r.pool_absorb, 9_000);
    assert_eq!(r.cranker_fee + r.pool_absorb, 10_000);
}

#[test]
fn test_red_numbers() {
    let reds = [
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ];
    for &n in reds.iter() {
        assert!(is_red(n), "{} should be red", n);
    }

    let blacks = [
        2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
    ];
    for &n in blacks.iter() {
        assert!(!is_red(n), "{} should be black", n);
    }

    assert!(!is_red(0), "0 should be neither red nor black");
}
