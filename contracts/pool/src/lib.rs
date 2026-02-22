#![no_std]

mod storage;

#[cfg(test)]
mod test;

use common::constants::{BPS_DENOMINATOR, GAME_TTL_LEDGERS, MAX_BET_RATIO_BPS};
use soroban_sdk::{contract, contractimpl, token, Address, Env};
use storage::*;

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);
}

#[contract]
pub struct PoolContract;

#[contractimpl]
impl PoolContract {
    /// Initialize the pool contract.
    /// Note: roulette address is set separately via `set_roulette` to avoid
    /// circular dependency at deploy time (pool needs roulette, roulette needs pool).
    pub fn __constructor(env: Env, admin: Address, token: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        set_pool_balance(&env, 0);
        set_total_shares(&env, 0);
    }

    /// Set the roulette contract address. Admin-only, can only be called once.
    pub fn set_roulette(env: Env, roulette: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        assert!(
            !env.storage().instance().has(&DataKey::Roulette),
            "roulette already set"
        );
        env.storage().instance().set(&DataKey::Roulette, &roulette);
    }

    /// LP deposits tokens into the pool and receives shares.
    pub fn deposit(env: Env, lp: Address, amount: i128) {
        bump_instance(&env);
        lp.require_auth();
        assert!(amount > 0, "amount must be positive");

        let pool_balance = get_pool_balance(&env);
        let total_shares = get_total_shares(&env);

        // Calculate shares: first deposit is 1:1, then proportional
        let new_shares = if total_shares == 0 {
            amount
        } else {
            amount * total_shares / pool_balance
        };
        assert!(new_shares > 0, "deposit too small");

        // Transfer tokens from LP to this contract
        let token = get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&lp, &env.current_contract_address(), &amount);

        // Update state
        let lp_shares = get_lp_shares(&env, &lp);
        set_lp_shares(&env, &lp, lp_shares + new_shares);
        set_pool_balance(&env, pool_balance + amount);
        set_total_shares(&env, total_shares + new_shares);
    }

    /// LP burns shares to withdraw proportional tokens.
    pub fn withdraw(env: Env, lp: Address, shares: i128) {
        bump_instance(&env);
        lp.require_auth();
        assert!(shares > 0, "shares must be positive");

        let lp_shares = get_lp_shares(&env, &lp);
        assert!(shares <= lp_shares, "insufficient shares");

        let pool_balance = get_pool_balance(&env);
        let total_shares = get_total_shares(&env);

        // Calculate token amount: proportional to share of pool
        let amount = shares * pool_balance / total_shares;
        assert!(amount > 0, "withdraw amount too small");

        // Transfer tokens from pool to LP
        let token = get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &lp, &amount);

        // Update state
        set_lp_shares(&env, &lp, lp_shares - shares);
        set_pool_balance(&env, pool_balance - amount);
        set_total_shares(&env, total_shares - shares);
    }

    /// Called by roulette contract when player wins — pays out from pool.
    pub fn payout(env: Env, winner: Address, amount: i128) {
        bump_instance(&env);
        // Only roulette contract can call this
        let roulette = get_roulette(&env);
        roulette.require_auth();

        assert!(amount > 0, "amount must be positive");
        let pool_balance = get_pool_balance(&env);
        assert!(amount <= pool_balance, "insufficient pool balance");

        let token = get_token(&env);
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &winner, &amount);

        set_pool_balance(&env, pool_balance - amount);
    }

    /// Called by roulette contract when player loses — pool absorbs the bet.
    /// This is how LPs profit: pool_balance increases, shares stay the same.
    pub fn absorb(env: Env, amount: i128) {
        bump_instance(&env);
        let roulette = get_roulette(&env);
        roulette.require_auth();

        assert!(amount > 0, "amount must be positive");

        // Token already transferred to pool by roulette contract
        let pool_balance = get_pool_balance(&env);
        set_pool_balance(&env, pool_balance + amount);
    }

    /// Maximum bet allowed (2% of pool balance).
    pub fn get_max_bet(env: Env) -> i128 {
        let pool_balance = get_pool_balance(&env);
        pool_balance * (MAX_BET_RATIO_BPS as i128) / (BPS_DENOMINATOR as i128)
    }

    pub fn get_pool_balance(env: Env) -> i128 {
        get_pool_balance(&env)
    }

    pub fn get_total_shares(env: Env) -> i128 {
        get_total_shares(&env)
    }

    pub fn get_lp_shares(env: Env, lp: Address) -> i128 {
        get_lp_shares(&env, &lp)
    }

    /// Share price in stroops (pool_balance * 1e7 / total_shares for precision).
    pub fn get_share_price(env: Env) -> i128 {
        let pool_balance = get_pool_balance(&env);
        let total_shares = get_total_shares(&env);
        if total_shares == 0 {
            return 0;
        }
        pool_balance * 10_000_000 / total_shares
    }
}
