# contracts/common — Shared Types & Crypto

## What is this

A Rust library crate (`rlib`, not deployed as a contract) that provides shared types, constants, and cryptographic utilities used by all other contracts.

## Modules

- `constants.rs` — All numeric constants (payouts, fees, timeouts, limits)
- `types.rs` — Shared types: `BetType`, `Round`, `StoredBet`, `SettlementResult`, `VerificationKeys`, `RoundStatus`
- `zk.rs` — Groth16 verification logic (`verify_groth16`) and Poseidon hashing (`hash`)

## How to modify

### Adding a new shared type

1. Define the struct/enum in `types.rs` with `#[contracttype]` derive
2. Export it from `lib.rs` if not already re-exported via `pub use`
3. Import in consuming crates via `use common::NewType`

### Adding a new constant

Add to `constants.rs`. Use BPS convention for ratios (10000 = 100%).

### Updating Groth16 verification

The `verify_groth16` function in `zk.rs` performs the BN254 pairing check. The `g2_swap_array` helper handles the G2 coordinate swap (c0|c1 → c1|c0) that differs between snarkjs and Soroban. This swap applies to **all** G2 points — both the proof's `b` point and the verification key points (beta, gamma, delta). Do not change the swap logic unless the snarkjs output format changes.

## Key details

- `BetType` enum covers: Straight(u32), Red, Black, Even, Odd, Low, High, Dozen(u32)
- `Round` and `StoredBet` are separate structs because Soroban limits struct size in storage
- `ZK_PUBLIC_INPUTS = 4`: commit, seed_cranker, seed_player, resultado
- `verify_groth16` uses `env.crypto().bn254()` for BN254 pairing operations
- `hash` uses `soroban_poseidon::poseidon2_hash` for Poseidon2 over BN254 field

## Testing

```bash
cargo test -p common
```

This crate has no contract-level tests since it's a library. It's tested transitively through pool, roulette, and verifier tests.
