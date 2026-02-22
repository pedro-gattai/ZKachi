use soroban_sdk::{contracttype, Address, Env};

const INSTANCE_TTL_LEDGERS: u32 = 518_400; // ~30 days
const SESSION_TTL_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum SessionStatus {
    Active,
    Finished,
    TimedOut,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct GameSession {
    pub game_id: Address,
    pub session_id: u32,
    pub player1: Address,
    pub player2: Address,
    pub player1_points: i128,
    pub player2_points: i128,
    pub status: SessionStatus,
    pub player1_won: bool,
    pub result: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Session(u32),
    TotalSessions,
}

pub fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_LEDGERS, INSTANCE_TTL_LEDGERS);
}

pub fn get_session(env: &Env, session_id: u32) -> Option<GameSession> {
    let key = DataKey::Session(session_id);
    env.storage().persistent().get(&key)
}

pub fn set_session(env: &Env, session: &GameSession) {
    let key = DataKey::Session(session.session_id);
    env.storage().persistent().set(&key, session);
    env.storage()
        .persistent()
        .extend_ttl(&key, SESSION_TTL_LEDGERS, SESSION_TTL_LEDGERS);
}

pub fn get_total_sessions(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::TotalSessions)
        .unwrap_or(0)
}

pub fn set_total_sessions(env: &Env, count: u32) {
    env.storage()
        .instance()
        .set(&DataKey::TotalSessions, &count);
}
