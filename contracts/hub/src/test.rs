use crate::storage::SessionStatus;
use crate::{GameHubContract, GameHubContractClient};
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_start_and_end_game() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(GameHubContract, (&admin,));
    let client = GameHubContractClient::new(&env, &contract_id);

    let game_id = Address::generate(&env);
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);

    // Start a game session
    client.start_game(&game_id, &1u32, &player1, &player2, &100i128, &0i128);

    assert_eq!(client.get_total_sessions(), 1);

    let session = client.get_session(&1u32);
    assert!(session.is_some());
    let session = session.unwrap();
    assert_eq!(session.player1, player1);
    assert_eq!(session.player2, player2);
    assert_eq!(session.player1_points, 100);

    // End the game (verified settlement, bet = 10, result = 17)
    client.end_game(&1u32, &true, &false, &10i128, &17u32);

    let session = client.get_session(&1u32).unwrap();
    assert!(session.player1_won);
    assert_eq!(session.status, SessionStatus::Finished);
    assert_eq!(session.player2_points, 10);
    assert_eq!(session.result, 17);
}

#[test]
fn test_multiple_sessions() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(GameHubContract, (&admin,));
    let client = GameHubContractClient::new(&env, &contract_id);

    let game_id = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);

    client.start_game(&game_id, &1u32, &p1, &p2, &50i128, &0i128);
    client.start_game(&game_id, &2u32, &p2, &p1, &75i128, &0i128);

    assert_eq!(client.get_total_sessions(), 2);

    client.end_game(&1u32, &true, &false, &20i128, &5u32);
    client.end_game(&2u32, &false, &false, &30i128, &0u32);

    let s1 = client.get_session(&1u32).unwrap();
    assert!(s1.player1_won);
    assert_eq!(s1.status, SessionStatus::Finished);
    assert_eq!(s1.player2_points, 20);
    assert_eq!(s1.result, 5);

    let s2 = client.get_session(&2u32).unwrap();
    assert!(!s2.player1_won);
    assert_eq!(s2.status, SessionStatus::Finished);
    assert_eq!(s2.player2_points, 30);
    assert_eq!(s2.result, 0);
}

#[test]
fn test_timeout_session() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(GameHubContract, (&admin,));
    let client = GameHubContractClient::new(&env, &contract_id);

    let game_id = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);

    client.start_game(&game_id, &1u32, &p1, &p2, &50i128, &0i128);

    // End with timeout (bet = 15, result = 37 sentinel)
    client.end_game(&1u32, &true, &true, &15i128, &37u32);

    let session = client.get_session(&1u32).unwrap();
    assert!(session.player1_won);
    assert_eq!(session.status, SessionStatus::TimedOut);
    assert_eq!(session.player2_points, 15);
    assert_eq!(session.result, 37);
}
