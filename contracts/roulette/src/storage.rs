use common::constants::GAME_TTL_LEDGERS;
use common::types::{Round, StoredBet};
use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Pool,
    Verifier,
    Hub,
    Token,
    CurrentRound,
    CurrentBet,
    RoundCounter,
    HubSessionId,
}

pub fn get_pool(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Pool).unwrap()
}

pub fn get_verifier(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Verifier).unwrap()
}

pub fn get_hub(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Hub).unwrap()
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn get_round_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::RoundCounter)
        .unwrap_or(0)
}

pub fn set_round_counter(env: &Env, counter: u64) {
    env.storage()
        .instance()
        .set(&DataKey::RoundCounter, &counter);
}

pub fn get_hub_session_id(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::HubSessionId)
        .unwrap_or(0)
}

pub fn set_hub_session_id(env: &Env, id: u32) {
    env.storage().instance().set(&DataKey::HubSessionId, &id);
}

pub fn get_current_round(env: &Env) -> Option<Round> {
    env.storage().temporary().get(&DataKey::CurrentRound)
}

pub fn set_current_round(env: &Env, round: &Round) {
    env.storage().temporary().set(&DataKey::CurrentRound, round);
    env.storage().temporary().extend_ttl(
        &DataKey::CurrentRound,
        GAME_TTL_LEDGERS,
        GAME_TTL_LEDGERS,
    );
}

pub fn remove_current_round(env: &Env) {
    env.storage().temporary().remove(&DataKey::CurrentRound);
}

pub fn get_current_bet(env: &Env) -> Option<StoredBet> {
    env.storage().temporary().get(&DataKey::CurrentBet)
}

pub fn remove_current_bet(env: &Env) {
    env.storage().temporary().remove(&DataKey::CurrentBet);
}

pub fn set_current_bet(env: &Env, bet: &StoredBet) {
    env.storage().temporary().set(&DataKey::CurrentBet, bet);
    env.storage()
        .temporary()
        .extend_ttl(&DataKey::CurrentBet, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);
}
