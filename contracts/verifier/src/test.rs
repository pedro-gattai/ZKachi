// Verifier tests will be meaningful once we have real verification keys
// from the Circom trusted setup. For now, test the extract function.

use soroban_sdk::{Bytes, Env};

use crate::circuit;

#[test]
fn test_extract_proof_layout() {
    let env = Env::default();

    // Create a mock proof blob: 256 bytes proof + 4*32 bytes public inputs = 384 bytes
    let mut proof_data = [0u8; 384];

    // Mark proof section with a pattern
    for i in 0..256 {
        proof_data[i] = (i % 256) as u8;
    }

    // Set public inputs (4 x 32 bytes)
    // Input 0: commit = 42
    proof_data[256 + 31] = 42;
    // Input 1: seed_cranker = 7
    proof_data[288 + 31] = 7;
    // Input 2: seed_player = 13
    proof_data[320 + 31] = 13;
    // Input 3: resultado = 5
    proof_data[352 + 31] = 5;

    let proof = Bytes::from_slice(&env, &proof_data);
    let (raw, inputs) = circuit::extract(&env, &proof);

    // Raw proof should be 256 bytes
    assert_eq!(raw.len(), 256);

    // Check extracted public inputs
    assert_eq!(inputs[0], soroban_sdk::U256::from_u32(&env, 42));
    assert_eq!(inputs[1], soroban_sdk::U256::from_u32(&env, 7));
    assert_eq!(inputs[2], soroban_sdk::U256::from_u32(&env, 13));
    assert_eq!(inputs[3], soroban_sdk::U256::from_u32(&env, 5));
}
