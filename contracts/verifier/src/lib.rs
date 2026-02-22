#![no_std]

mod circuit;

#[cfg(test)]
mod test;

use common::constants::GAME_TTL_LEDGERS;
use common::zk::verify_groth16;
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
}

#[contract]
pub struct VerifierContract;

#[contractimpl]
impl VerifierContract {
    /// Initialize the verifier contract.
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Verify a Groth16 proof.
    /// The proof blob contains the raw proof (256 bytes) followed by public inputs (N * 32 bytes).
    /// Returns true if the proof is valid.
    pub fn verify(env: Env, proof: Bytes) -> bool {
        env.storage()
            .instance()
            .extend_ttl(GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);
        let (raw_proof, inputs) = circuit::extract(&env, &proof);
        verify_groth16(&env, &circuit::KEYS, &raw_proof, &inputs)
    }
}
