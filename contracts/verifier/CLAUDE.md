# contracts/verifier — Groth16 Proof Verification

## What is this

A Soroban contract that verifies Groth16 ZK proofs on-chain. Called by the roulette contract during `reveal_and_settle` to ensure the cranker's result is valid.

## Proof layout

The `verify` function receives a single `Bytes` blob (384 bytes total):

```
[0..256]   — Raw Groth16 proof
              a: G1 point (64 bytes)
              b: G2 point (128 bytes)
              c: G1 point (64 bytes)
[256..384] — 4 public inputs (32 bytes each)
              [0] commit      — Poseidon(seed_cranker, salt)
              [1] seed_cranker
              [2] seed_player
              [3] resultado   — game result (0-36)
```

## Key files

- `lib.rs` — Contract entry point with `verify(proof: Bytes) -> bool`
- `circuit.rs` — Hardcoded verification keys (`KEYS`) and `extract()` function that parses the proof blob

## How verification works

1. `circuit::extract(env, proof)` splits the blob into raw proof (256 bytes) and 4 public inputs
2. `common::verify_groth16(env, vk, proof, inputs)` performs the BN254 pairing check
3. Returns `true` if the proof is valid

## Updating verification keys after trusted setup

After running a new trusted setup (`circuits/roulette/scripts/setup.sh`):

1. The setup outputs `verification_key.json`
2. Extract the key points (alpha, beta, gamma, delta, IC) and convert to raw bytes
3. Update the `KEYS` constant in `circuit.rs` with the new values
4. Rebuild: `make build`

The `KEYS` struct uses `VerificationKeys` from `common/types.rs` with fields: `alpha` (G1), `beta` (G2), `gamma` (G2), `delta` (G2), `ic` (array of G1 points).

## Storage

Minimal — only stores `Admin` address via instance storage. The verification keys are compiled into the WASM binary (constant in `circuit.rs`).

## Testing

```bash
cargo test -p verifier
```

`test_extract_proof_layout()` verifies correct parsing of the proof blob format.

## Pitfalls

- Verification keys are **compile-time constants** — updating them requires redeployment
- G2 point byte order: snarkjs outputs c0|c1, Soroban expects c1|c0. This swap applies to **all** G2 points — both the proof's `b` point and the VK points (beta, gamma, delta). Handled by `g2_swap_array` in `common/zk.rs`.
- The proof blob is exactly 384 bytes — any other size will panic
