#![no_std]

mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env};
use storage::*;

#[contract]
pub struct GameHubContract;

#[contractimpl]
impl GameHubContract {
    /// Initialize the game hub contract.
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        set_total_sessions(&env, 0);
    }

    /// Called by a game contract when a new round starts.
    pub fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    ) {
        bump_instance(&env);

        let session = GameSession {
            game_id,
            session_id,
            player1,
            player2,
            player1_points,
            player2_points,
            status: SessionStatus::Active,
            player1_won: false,
            result: 37,
        };
        set_session(&env, &session);

        let total = get_total_sessions(&env);
        set_total_sessions(&env, total + 1);
    }

    /// Called by a game contract when a round finishes.
    pub fn end_game(
        env: Env,
        session_id: u32,
        player1_won: bool,
        timed_out: bool,
        bet_amount: i128,
        result: u32,
    ) {
        bump_instance(&env);

        let mut session = get_session(&env, session_id).expect("session not found");
        session.status = if timed_out {
            SessionStatus::TimedOut
        } else {
            SessionStatus::Finished
        };
        session.player1_won = player1_won;
        session.player2_points = bet_amount;
        session.result = result;
        set_session(&env, &session);
    }

    /// Query a game session by ID.
    pub fn get_session(env: Env, session_id: u32) -> Option<GameSession> {
        get_session(&env, session_id)
    }

    /// Get total number of sessions tracked.
    pub fn get_total_sessions(env: Env) -> u32 {
        get_total_sessions(&env)
    }
}
