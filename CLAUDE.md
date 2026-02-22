# ZKachi — Zero-Knowledge Roulette on Soroban

## What is this

On-chain roulette game running on Stellar/Soroban with Groth16 ZK proof verification. A cranker commits a hidden seed, a player bets, then the cranker reveals the seed with a ZK proof that the result is fair.

## Stack

- **Smart contracts:** Rust + Soroban SDK v25.0.0
- **ZK circuit:** Circom 2 + snarkjs (Groth16 over BN254)
- **Blockchain:** Stellar testnet (Soroban)
- **Toolchain:** Rust 1.89.0, target `wasm32-unknown-unknown`

## Project structure

```
contracts/
  common/     — Shared types, constants, Groth16 verifier logic (rlib, not deployed)
  hub/        — Game hub: session tracking for all games
  pool/       — Liquidity pool: LP deposits, payouts, share accounting
  roulette/   — Game logic: commit → bet → reveal → settle
  verifier/   — On-chain Groth16 proof verification contract
circuits/
  roulette/   — Circom circuit, compile/setup/prove scripts
cranker/      — Node.js bot: automated round management (commit/reveal)
frontend/     — Web frontend for the roulette game
scripts/      — Deploy, init, seed, and play scripts for testnet
```

## Architecture (data flow)

1. `deploy.sh` deploys pool, verifier, roulette contracts
2. `init.sh` links them via constructors (cross-contract references)
3. `seed-pool.sh` adds initial liquidity
4. Game round: `commit_round` → `place_bet` → `reveal_and_settle` (or `claim_timeout`)
5. Settlement calls pool.payout/pool.absorb and hub.end_game

## Key commands

```bash
make build          # Compile all contracts to WASM
make build-debug    # Compile with release-with-logs (assertions enabled)
make test           # Run all contract tests
make test-verbose   # Tests with stdout capture
make fmt            # Format all Rust code
make circuit        # Full circuit pipeline: compile → setup → prove
make deploy         # Deploy contracts to testnet
make init           # Initialize contracts with cross-references
make seed           # Seed the pool with initial liquidity
```

## Code conventions

- **No `std`:** All contract code is `#![no_std]` (Soroban WASM target)
- **Types in common:** Shared types (BetType, Round, StoredBet, VerificationKeys) live in `contracts/common/`
- **Storage pattern:** Instance storage for persistent state, temporary storage (with TTL) for game state (Round, Bet)
- **Auth model:** Functions that move tokens require `cranker.require_auth()` or `player.require_auth()`
- **Cross-contract calls:** Use Soroban client traits defined inline (e.g., `mod pool_contract { ... }`)
- **Constants:** All magic numbers live in `common/src/constants.rs` with BPS (basis points) convention
- **Error handling:** `panic!` on invalid state (Soroban convention — reverts the transaction)
- **Instance TTL:** All public functions call `extend_ttl()` on instance storage to prevent contract expiration (bump on access pattern)

## Key constants

| Constant | Value | Meaning |
|----------|-------|---------|
| MIN_BOND | 50 XLM | Minimum cranker bond |
| CRANKER_FEE_BPS | 1000 (10%) | Fee to cranker on losing bets |
| MAX_BET_RATIO_BPS | 200 (2%) | Max bet as % of pool |
| TIMEOUT_LEDGERS | 100 (~8 min) | Ledgers before timeout claim |
| PAYOUT_STRAIGHT | 36x | Straight bet payout |
| PAYOUT_EVEN_MONEY | 2x | Red/Black/Even/Odd/Low/High |
| PAYOUT_DOZEN | 3x | Dozen bet payout |

## Testing

All tests run via `cargo test` (or `make test`). Each contract crate has its own `test.rs` using `soroban_sdk::testutils`. Tests register contracts in a mock environment — no testnet needed.

## Pitfalls

- Soroban doesn't support `Option` in contract types — use status enums instead
- Proof bytes are 384 total: 256 (proof a+b+c) + 128 (4 × 32-byte public inputs)
- snarkjs outputs G2 points as c0|c1 but Soroban expects c1|c0 — the swap happens in `common/src/zk.rs` via `g2_swap_array` and applies to **all** G2 points (proof `b` point + VK beta/gamma/delta)
- Temporary storage needs explicit TTL extension via `extend_ttl()`

## Maintaining CLAUDE.md files

Every module has its own `CLAUDE.md` with module-specific context. When making changes that affect a module's architecture, public API, storage layout, conventions, or pitfalls, **update that module's CLAUDE.md accordingly**.

Checklist for when to update:
- New or removed public functions/entry points
- Changed storage keys or data types
- New dependencies or build steps
- New pitfalls or gotchas discovered
- Changed constants or configuration
- New files or significant restructuring

Module CLAUDE.md files:
- `contracts/common/CLAUDE.md`
- `contracts/hub/CLAUDE.md`
- `contracts/pool/CLAUDE.md`
- `contracts/roulette/CLAUDE.md`
- `contracts/verifier/CLAUDE.md`
- `circuits/roulette/CLAUDE.md`
- `cranker/CLAUDE.md`
- `frontend/CLAUDE.md`
- `scripts/CLAUDE.md`
