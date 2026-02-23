# ZKachi — Zero-Knowledge Roulette on Stellar

> **bet private, win public**

Provably fair on-chain roulette powered by Groth16 ZK proofs on Stellar/Soroban. No operators, no servers, no trust. The "house" is a collective liquidity pool — anyone can be the casino. Every round is cryptographically verified using Stellar's Protocol 25 (BN254 + Poseidon).

---

## Why ZK?

Online casinos require trust — players must believe the house isn't cheating. ZKachi eliminates that entirely:

- **The cranker commits a hidden seed** before the player bets (can't change it after)
- **The player provides their own seed** (can't be predicted by the cranker)
- **The result is deterministic:** `(seed_cranker + seed_player) % 37`
- **A Groth16 ZK proof** verified on-chain guarantees the math is correct — no trust needed
- **If the cranker refuses to reveal**, the player gets their bet back + the cranker's bond

Neither party can cheat. Neither party can predict the outcome. The math is the dealer.

### Hackathon Fit

ZKachi targets two inspiration categories from **Stellar Hacks: ZK Gaming**:

- **Provable randomness** (primary) — the roulette result is derived from two seeds (cranker + player) and proven correct via Groth16. Neither party can manipulate or predict the outcome.
- **Provable outcomes** (secondary) — every round's settlement is verified on-chain by a ZK proof. Players and LPs can independently verify that payouts match the proven result.

---

## How a Round Works

```
PHASE 1: COMMIT                    PHASE 2: BET                        PHASE 3: REVEAL + SETTLE
┌─────────────────────┐            ┌─────────────────────┐              ┌─────────────────────────┐
│ Cranker picks seed  │            │ Player sees commit  │              │ Cranker submits ZK proof│
│ commit = Poseidon(  │            │ (can't derive seed) │              │ proving:                │
│   seed, salt)       │───────────▶│ Player picks own    │─────────────▶│  1. commit is valid     │
│ Posts commit +      │            │   seed + bet type   │              │  2. result = (s1+s2)%37 │
│   bond on-chain     │            │ Posts bet on-chain  │              │  3. 0 <= result <= 36   │
└─────────────────────┘            └─────────────────────┘              │ Contract settles payout │
                                                                       └─────────────────────────┘
```

**Timeout safety:** If the cranker doesn't reveal within ~8 minutes (100 ledgers), the player claims their bet back + the cranker's bond as punishment.

---

## Architecture

```
                    ┌──────────────────────┐
                    │     HUB CONTRACT     │
                    │   (Game Studio)      │
                    │  start/end_game()    │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
   ┌────────▼────────┐  ┌─────▼──────┐  ┌────────▼────────┐
   │   ROULETTE      │  │   POOL     │  │   VERIFIER      │
   │                 │  │            │  │                 │
   │ commit_round()  │  │ deposit()  │  │ verify_proof()  │
   │ place_bet()     │◀▸│ withdraw() │  │ BN254 pairings  │
   │ reveal_settle() │  │ payout()   │  │ Groth16 check   │
   │ claim_timeout() │  │ absorb()   │  │                 │
   └─────────────────┘  └────────────┘  └─────────────────┘
```

| Contract | Role |
|----------|------|
| **Roulette** | Game logic: commit, bet, reveal, settle, timeout |
| **Pool** | Liquidity pool: LP deposits, share accounting, payouts |
| **Verifier** | On-chain Groth16 proof verification via BN254 (Protocol 25) |
| **Common** | Shared library: types, constants, ZK verifier logic (not deployed) |
| **Hub** | Stellar Game Studio integration: session tracking via `start_game()` / `end_game()` |

The roulette contract integrates with the [Stellar Game Studio](https://github.com/jamesbachini/Stellar-Game-Studio) hub contract — every round calls `start_game()` on commit and `end_game()` on settlement, enabling cross-game session tracking and analytics on Stellar.

---

## Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Animations | Framer Motion |
| Blockchain | Stellar SDK + Freighter wallet |
| Data fetching | TanStack React Query (3s game polling, 10s pool/hub) |

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Hero section with animated 3D roulette wheel |
| **Game** | `/app/game` | Betting board + game status panel, live round interaction |
| **Pool** | `/app/pool` | LP dashboard: deposit, withdraw, share accounting |
| **Verify** | `/app/verify` | ZK proof explorer: round data, commits, seeds, results |
| **Docs** | `/app/docs` | How to play, bet types, pool mechanics, ZK verification |

All reads and writes go live to Soroban testnet — connect a Freighter wallet to play.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Rust + Soroban SDK v25.0.0 |
| ZK circuit | Circom 2 + snarkjs (Groth16 over BN254) |
| On-chain verification | Stellar Protocol 25 native BN254 pairings |
| Blockchain | Stellar testnet (Soroban) |
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Framer Motion |
| Wallet | Freighter (Stellar SDK) |
| Cranker bot | Node.js (Poseidon hashing + snarkjs proof generation) |
| Toolchain | Rust 1.89.0, `wasm32-unknown-unknown` |

---

## Project Structure

```
contracts/
  common/       Shared types, constants, Groth16 verifier logic (rlib)
  hub/          Stellar Game Studio: session tracking
  pool/         Liquidity pool: deposits, payouts, share accounting
  roulette/     Game logic: commit -> bet -> reveal -> settle
  verifier/     On-chain Groth16 proof verification
circuits/
  roulette/     Circom circuit + compile/setup/prove scripts
cranker/        Automated cranker bot (Node.js)
frontend/       React + TypeScript web app (Vite + Tailwind + shadcn/ui)
scripts/        Deploy, init, seed, and play scripts for testnet
```

---

## Quick Start

### Prerequisites

- Rust 1.89.0+ with `wasm32-unknown-unknown` target
- `stellar` CLI (Soroban)
- Node.js 18+ (for circuit pipeline and cranker)
- `circom` v2+ and `snarkjs` (for ZK circuit)

### Build & Test

```bash
# Build all contracts to WASM
make build

# Run all tests (30 tests across pool, roulette, verifier)
make test

# Compile ZK circuit + trusted setup + generate proof
make circuit
```

### Deploy to Testnet

```bash
# 1. Deploy all 3 contracts (creates .env with contract IDs)
make deploy

# 2. Initialize cross-contract references
make init

# 3. Seed the pool with initial liquidity (1000 XLM)
make seed

# 4. Play a test round (commit -> bet -> reveal with ZK proof)
make play
```

### Run the Cranker Bot

```bash
make cranker-install   # Install dependencies
make cranker           # Start automated round operator
```

---

## Game Constants

| Parameter | Value | Description |
|-----------|-------|-------------|
| Min bond | 50 XLM | Cranker's guarantee deposit |
| Cranker fee | 10% | Fee on losing bets paid to cranker |
| Max bet | 2% of pool | Variance protection for LPs |
| Timeout | ~8 min (100 ledgers) | Time before player can claim timeout |

### Payouts (European Roulette)

| Bet Type | Payout | Examples |
|----------|--------|---------|
| Straight | 36x | Exact number (0-36) |
| Even money | 2x | Red/Black, Even/Odd, Low/High |
| Dozen | 3x | 1-12, 13-24, 25-36 |

House edge: **2.7%** (mathematical — when 0 hits, even-money bets lose).

---

## How LPs Earn

The pool acts as the collective house. When players lose, `pool.absorb()` increases the pool balance but total LP shares stay constant — each share becomes worth more XLM. LPs earn passively from the mathematical house edge, exactly like DEX LP tokens appreciating from trading fees.

---

## ZK Circuit

The Circom circuit (`circuits/roulette/roulette.circom`) proves three things:

1. **Commit validity:** `Poseidon(seed_cranker, salt) == commit`
2. **Valid range:** `0 <= resultado <= 36`
3. **Correct computation:** `resultado == (seed_cranker + seed_player) % 37`

Public inputs: `commit`, `seed_cranker`, `seed_player`, `resultado`
Private input: `salt` (never revealed on-chain)

The proof is generated with snarkjs (Groth16) and verified on-chain using Stellar's native BN254 pairing operations from Protocol 25.

---

## Tests

30 tests across all contracts:

```
contracts/pool      — 8 tests  (deposit, withdraw, payout, absorb, edge cases)
contracts/roulette  — 21 tests (game flow, timeouts, bet types, settlement)
contracts/verifier  — 1 test   (proof verification with real VK)
```

```bash
make test           # Run all
make test-verbose   # With stdout output
```

---

## References

- [Stellar Game Studio](https://github.com/jamesbachini/Stellar-Game-Studio) — Hackathon framework
- [xray-games](https://github.com/fredericrezeau/xray-games) — ZK on Stellar reference (Circom + Groth16)
- [Protocol 25 (X-Ray)](https://stellar.org/blog/developers/announcing-stellar-x-ray-protocol-25) — BN254 native support
- [Circom](https://docs.circom.io/) — Circuit compiler
- [snarkjs](https://github.com/iden3/snarkjs) — Groth16 prover/verifier

---

*ZKachi — bet private, win public*
