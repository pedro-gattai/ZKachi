#![no_std]

mod settlement;
mod storage;

#[cfg(test)]
mod test;

use common::constants::{GAME_TTL_LEDGERS, MIN_BOND, TIMEOUT_LEDGERS};
use common::types::{BetType, Round, RoundStatus, StoredBet};
use settlement::compute_settlement;
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Bytes, BytesN, Env};
use storage::*;

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);
}

/// Hub contract client — auto-generated from trait.
#[soroban_sdk::contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );

    fn end_game(env: Env, session_id: u32, player1_won: bool, timed_out: bool, bet_amount: i128, result: u32);
}

/// Pool contract client — auto-generated from trait.
#[soroban_sdk::contractclient(name = "PoolClient")]
pub trait Pool {
    fn payout(env: Env, winner: Address, amount: i128);
    fn absorb(env: Env, amount: i128);
    fn get_max_bet(env: Env) -> i128;
    fn get_pool_balance(env: Env) -> i128;
}

/// Verifier contract client — auto-generated from trait.
#[soroban_sdk::contractclient(name = "VerifierClient")]
pub trait Verifier {
    fn verify(env: Env, proof: Bytes) -> bool;
}

#[contract]
pub struct RouletteContract;

#[contractimpl]
impl RouletteContract {
    /// Initialize the roulette contract with cross-contract references.
    pub fn __constructor(
        env: Env,
        admin: Address,
        pool: Address,
        verifier: Address,
        hub: Address,
        token: Address,
    ) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Pool, &pool);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::Hub, &hub);
        env.storage().instance().set(&DataKey::Token, &token);
        set_round_counter(&env, 0);
        set_hub_session_id(&env, 0);
    }

    /// Cranker opens a new round by committing a hash.
    /// commit = Poseidon(seed_cranker, salt) — computed off-chain.
    pub fn commit_round(env: Env, cranker: Address, commit: BytesN<32>, bond: i128) {
        bump_instance(&env);
        cranker.require_auth();

        // Allow new round only if no active round, or previous round is finished
        if let Some(prev) = get_current_round(&env) {
            match prev.status {
                RoundStatus::Settled | RoundStatus::TimedOut => {
                    // Previous round finished, clean up
                }
                RoundStatus::Open => {
                    // Previous round had no bet — return bond to previous cranker
                    let token = get_token(&env);
                    let token_client = token::Client::new(&env, &token);
                    token_client.transfer(
                        &env.current_contract_address(),
                        &prev.cranker,
                        &prev.bond,
                    );
                }
                RoundStatus::BetPlaced => {
                    panic!("round already in progress");
                }
            }
            remove_current_round(&env);
            remove_current_bet(&env);
        }
        assert!(bond >= MIN_BOND, "bond below minimum");

        // Transfer bond from cranker to this contract (escrow)
        let token = get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&cranker, &env.current_contract_address(), &bond);

        // Create new round
        let round_id = get_round_counter(&env) + 1;
        set_round_counter(&env, round_id);

        let round = Round {
            id: round_id,
            cranker: cranker.clone(),
            commit,
            bond,
            status: RoundStatus::Open,
            commit_ledger: env.ledger().sequence(),
            result: 0,
        };
        set_current_round(&env, &round);

        // Notify hub: start_game
        let hub = get_hub(&env);
        let session_id = get_hub_session_id(&env) + 1;
        set_hub_session_id(&env, session_id);

        let hub_client = GameHubClient::new(&env, &hub);
        hub_client.start_game(
            &env.current_contract_address(),
            &session_id,
            &cranker,
            &cranker, // player2 = cranker (will be updated on bet)
            &bond,
            &0i128,
        );
    }

    /// Player places a bet on an open round.
    pub fn place_bet(
        env: Env,
        player: Address,
        bet_type: BetType,
        seed_player: BytesN<32>,
        amount: i128,
    ) {
        bump_instance(&env);
        player.require_auth();

        let mut round = get_current_round(&env).expect("no active round");
        assert!(round.status == RoundStatus::Open, "round not open for bets");
        assert!(player != round.cranker, "cranker cannot bet on own round");
        assert!(amount > 0, "bet must be positive");

        // Validate bet type
        match &bet_type {
            BetType::Straight(n) => assert!(*n <= 36, "invalid straight number"),
            BetType::Dozen(d) => assert!(*d >= 1 && *d <= 3, "invalid dozen"),
            _ => {}
        }

        // Check max bet from pool
        let pool = get_pool(&env);
        let pool_client = PoolClient::new(&env, &pool);
        let max_bet = pool_client.get_max_bet();
        assert!(amount <= max_bet, "bet exceeds max bet");

        // Check pool can cover potential payout
        let pool_balance = pool_client.get_pool_balance();
        let max_payout = get_max_payout(&bet_type, amount);
        assert!(max_payout <= pool_balance, "pool cannot cover payout");

        // Transfer bet amount from player to this contract (escrow)
        let token = get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&player, &env.current_contract_address(), &amount);

        // Store bet separately (Soroban contracttype doesn't support Option)
        let bet = StoredBet {
            player,
            bet_type,
            amount,
            seed_player,
        };
        set_current_bet(&env, &bet);

        round.status = RoundStatus::BetPlaced;
        set_current_round(&env, &round);
    }

    /// Cranker reveals seed and submits ZK proof to settle the round.
    pub fn reveal_and_settle(env: Env, cranker: Address, seed_cranker: BytesN<32>, proof: Bytes) {
        bump_instance(&env);
        cranker.require_auth();

        let mut round = get_current_round(&env).expect("no active round");
        assert!(
            round.status == RoundStatus::BetPlaced,
            "round not ready for reveal"
        );
        assert!(round.cranker == cranker, "not the round cranker");

        // Verify ZK proof on-chain
        let verifier = get_verifier(&env);
        let verifier_client = VerifierClient::new(&env, &verifier);
        assert!(verifier_client.verify(&proof), "invalid ZK proof");

        let bet = get_current_bet(&env).expect("no bet found");

        // Compute result: (seed_cranker + seed_player) % 37
        let resultado = compute_result(&seed_cranker, &bet.seed_player);
        round.result = resultado;

        // Settle
        let settlement = compute_settlement(resultado, &bet.bet_type, bet.amount);

        let token = get_token(&env);
        let token_client = token::Client::new(&env, &token);
        let pool = get_pool(&env);
        let pool_client = PoolClient::new(&env, &pool);

        if settlement.player_won {
            // Return escrowed bet to player
            token_client.transfer(&env.current_contract_address(), &bet.player, &bet.amount);
            // Pool pays winnings
            pool_client.payout(&bet.player, &settlement.payout);
        } else {
            // Transfer escrowed bet to pool (minus cranker fee)
            let pool_amount = settlement.pool_absorb;
            token_client.transfer(&env.current_contract_address(), &pool, &pool_amount);
            pool_client.absorb(&pool_amount);

            // Pay cranker fee
            if settlement.cranker_fee > 0 {
                token_client.transfer(
                    &env.current_contract_address(),
                    &cranker,
                    &settlement.cranker_fee,
                );
            }
        }

        // Return bond to cranker
        token_client.transfer(&env.current_contract_address(), &cranker, &round.bond);

        // Notify hub: end_game
        let hub = get_hub(&env);
        let session_id = get_hub_session_id(&env);
        let hub_client = GameHubClient::new(&env, &hub);
        hub_client.end_game(&session_id, &settlement.player_won, &false, &bet.amount, &resultado);

        // Update round status
        round.status = RoundStatus::Settled;
        set_current_round(&env, &round);

        // Emit event
        #[allow(deprecated)]
        env.events().publish(
            (symbol_short!("settle"), round.id),
            (resultado, settlement.player_won),
        );
    }

    /// Player claims timeout if cranker doesn't reveal within TIMEOUT_LEDGERS.
    pub fn claim_timeout(env: Env, player: Address) {
        bump_instance(&env);
        player.require_auth();

        let mut round = get_current_round(&env).expect("no active round");
        assert!(
            round.status == RoundStatus::BetPlaced,
            "round not in bet placed state"
        );

        let bet = get_current_bet(&env).expect("no bet found");
        assert!(bet.player == player, "not the player");

        // Check timeout
        let current_ledger = env.ledger().sequence();
        assert!(
            current_ledger > round.commit_ledger + TIMEOUT_LEDGERS,
            "timeout not reached"
        );

        let token = get_token(&env);
        let token_client = token::Client::new(&env, &token);

        // Return bet to player
        token_client.transfer(&env.current_contract_address(), &player, &bet.amount);

        // Transfer cranker's bond to player as punishment
        token_client.transfer(&env.current_contract_address(), &player, &round.bond);

        // Notify hub: end_game (player wins by timeout)
        let hub = get_hub(&env);
        let session_id = get_hub_session_id(&env);
        let hub_client = GameHubClient::new(&env, &hub);
        hub_client.end_game(&session_id, &true, &true, &bet.amount, &37u32);

        // Update status
        round.status = RoundStatus::TimedOut;
        set_current_round(&env, &round);

        #[allow(deprecated)]
        env.events()
            .publish((symbol_short!("timeout"), round.id), player);
    }

    /// Get the current active round.
    pub fn get_current_round(env: Env) -> Option<Round> {
        get_current_round(&env)
    }

    /// Get the current bet (needed by cranker to read seed_player).
    pub fn get_current_bet(env: Env) -> Option<StoredBet> {
        get_current_bet(&env)
    }

    /// Get the round counter.
    pub fn get_round_counter(env: Env) -> u64 {
        get_round_counter(&env)
    }
}

/// Compute roulette result from two seeds: (seed_cranker + seed_player) % 37.
fn compute_result(seed_cranker: &BytesN<32>, seed_player: &BytesN<32>) -> u32 {
    let a_val = last_8_bytes_as_u64(seed_cranker);
    let b_val = last_8_bytes_as_u64(seed_player);
    let combined = a_val.wrapping_add(b_val);
    (combined % 37) as u32
}

fn last_8_bytes_as_u64(bytes: &BytesN<32>) -> u64 {
    let arr = bytes.to_array();
    u64::from_be_bytes([
        arr[24], arr[25], arr[26], arr[27], arr[28], arr[29], arr[30], arr[31],
    ])
}

/// Calculate maximum payout for a bet type and amount.
fn get_max_payout(bet_type: &BetType, amount: i128) -> i128 {
    let multiplier = match bet_type {
        BetType::Straight(_) => 35, // Net payout from pool
        BetType::Dozen(_) => 2,
        _ => 1, // Even money: pool pays 1:1
    };
    amount * multiplier
}
