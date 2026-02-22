use crate::types::VerificationKeys;
use soroban_poseidon::poseidon2_hash;
use soroban_sdk::{
    crypto::bn254::{Bn254G1Affine, Bn254G2Affine, Fr},
    crypto::BnScalar,
    vec, Bytes, Env, Vec, U256,
};

/// Swap G2 bytes from snarkjs order (c0|c1) to Soroban order (c1|c0).
/// snarkjs outputs Fp2 elements as (c0, c1) but Soroban expects (c1, c0).
fn g2_swap_array(env: &Env, arr: &[u8; 128]) -> Bytes {
    let raw = Bytes::from_slice(env, arr);
    let mut swapped = Bytes::new(env);
    swapped.append(&raw.slice(32..64)); // x.c1
    swapped.append(&raw.slice(0..32)); // x.c0
    swapped.append(&raw.slice(96..128)); // y.c1
    swapped.append(&raw.slice(64..96)); // y.c0
    swapped
}

/// Verify a Groth16 proof using BN254 pairings (Protocol 25 native).
/// Following xray-games pattern.
///
/// Proof layout from snarkjs (256 bytes):
///   - [0..64]:    G1 point `a`
///   - [64..192]:  G2 point `b` (needs byte reordering: snarkjs c0|c1 → soroban c1|c0)
///   - [192..256]: G1 point `c`
pub fn verify_groth16(env: &Env, vk: &VerificationKeys, proof: &Bytes, inputs: &[U256]) -> bool {
    // Parse G2 point b with byte reordering for snarkjs compatibility.
    // snarkjs outputs c0|c1 but Soroban SDK expects c1|c0 within each Fp2 element.
    let raw = proof.slice(64..192);
    let mut b_bytes = Bytes::new(env);
    b_bytes.append(&raw.slice(32..64));
    b_bytes.append(&raw.slice(0..32));
    b_bytes.append(&raw.slice(96..128));
    b_bytes.append(&raw.slice(64..96));

    let a = Bn254G1Affine::from_bytes(proof.slice(0..64).try_into().unwrap());
    let b = Bn254G2Affine::from_bytes(b_bytes.try_into().unwrap());
    let c = Bn254G1Affine::from_bytes(proof.slice(192..256).try_into().unwrap());
    let alpha = Bn254G1Affine::from_array(env, &vk.alpha);
    let beta = Bn254G2Affine::from_bytes(g2_swap_array(env, &vk.beta).try_into().unwrap());
    let gamma = Bn254G2Affine::from_bytes(g2_swap_array(env, &vk.gamma).try_into().unwrap());
    let delta = Bn254G2Affine::from_bytes(g2_swap_array(env, &vk.delta).try_into().unwrap());

    // Compute l = ic[0] + sum(inputs[i] * ic[i+1])
    let bn254 = env.crypto().bn254();
    let mut l = Bn254G1Affine::from_array(env, &vk.ic[0]);
    for i in 0..inputs.len() {
        let ic = Bn254G1Affine::from_array(env, &vk.ic[i + 1]);
        let scalar = Fr::from_u256(inputs[i].clone());
        let term = bn254.g1_mul(&ic, &scalar);
        l = bn254.g1_add(&l, &term);
    }

    // Pairing check: e(-a, b) * e(alpha, beta) * e(l, gamma) * e(c, delta) == 1
    let g1: Vec<Bn254G1Affine> = vec![env, -a, alpha, l, c];
    let g2: Vec<Bn254G2Affine> = vec![env, b, beta, gamma, delta];
    bn254.pairing_check(g1, g2)
}

/// Compute Poseidon2 hash of two BN254 field elements.
/// Used for commit verification: commit = hash(seed_cranker, salt).
pub fn hash(env: &Env, a: &U256, b: &U256) -> U256 {
    let inputs = vec![env, a.clone(), b.clone()];
    poseidon2_hash::<4, BnScalar>(env, &inputs)
}
