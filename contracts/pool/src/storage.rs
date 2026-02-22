use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    Roulette,
    PoolBalance,
    TotalShares,
    LpShares(Address),
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn get_roulette(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Roulette).unwrap()
}

pub fn get_pool_balance(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::PoolBalance)
        .unwrap_or(0)
}

pub fn set_pool_balance(env: &Env, balance: i128) {
    env.storage()
        .instance()
        .set(&DataKey::PoolBalance, &balance);
}

pub fn get_total_shares(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalShares)
        .unwrap_or(0)
}

pub fn set_total_shares(env: &Env, shares: i128) {
    env.storage().instance().set(&DataKey::TotalShares, &shares);
}

pub fn get_lp_shares(env: &Env, lp: &Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::LpShares(lp.clone()))
        .unwrap_or(0)
}

pub fn set_lp_shares(env: &Env, lp: &Address, shares: i128) {
    env.storage()
        .instance()
        .set(&DataKey::LpShares(lp.clone()), &shares);
}
