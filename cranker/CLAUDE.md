# cranker — Automated Round Bot

## What is this

Node.js bot that automates the commit → reveal cycle for the roulette game. It generates seeds, commits them on-chain, waits for a player bet, then generates a ZK proof and settles the round.

## Stack

- **Runtime:** Node.js (CommonJS)
- **Dependencies:** snarkjs (Groth16 proving), circomlibjs (Poseidon hashing), dotenv

## Structure

```
cranker.js          — Entry point, state machine, polling loop
lib/
  stellar.js        — Wrapper around `stellar contract invoke` (CLI child_process)
  seed.js           — Seed generation, Poseidon commit, result computation
  proof.js          — ZK proof generation via snarkjs, serialization to 384-byte hex
```

## State machine

```
IDLE → COMMITTED → READY_REVEAL → IDLE
```

1. **IDLE** — Generate random seed + salt, compute Poseidon commit, call `commit_round` on-chain. Transition to COMMITTED.
2. **COMMITTED** — Poll `get_current_round` waiting for a player bet. If `BetPlaced` detected, transition to READY_REVEAL. If `Settled`/`TimedOut`, go back to IDLE.
3. **READY_REVEAL** — Read player seed from `get_current_bet`, compute result `(seed_cranker + seed_player) % 37`, generate ZK proof, call `reveal_and_settle`. Go back to IDLE.

The bot polls every 6 seconds (configurable). Errors are logged and retried on the next tick.

## Commands

```bash
npm start          # or: node cranker.js
```

## External dependencies

- **`stellar` CLI** must be installed and on PATH
- **Funded identity** configured (default identity or set via `SOURCE` env var)
- **Circuit artifacts** compiled at `../circuits/roulette/build/`:
  - `roulette_js/roulette.wasm` (witness generation)
  - `roulette_final.zkey` (proving key)

## Environment variables

Loaded from `../.env` (project root):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ROULETTE_ID` | Yes | — | Roulette contract address |
| `NETWORK` | No | `testnet` | Stellar network |
| `SOURCE` | No | `default` | Stellar CLI identity for signing |
| `CRANKER_BOND` | No | `500000000` (50 XLM) | Bond amount in stroops |
| `POLL_INTERVAL_MS` | No | `6000` | Polling interval in milliseconds |

## Modules

### `lib/stellar.js`

Invokes Soroban contract methods by spawning `stellar contract invoke` as a child process. Provides `commitRound()`, `revealAndSettle()`, `getCurrentRound()`, `getCurrentBet()`, `getCrankerAddress()`.

### `lib/seed.js`

- `generateSeedAndCommit()` — Random u32 seed + 248-bit salt → Poseidon commit
- `computeResult(seedCrankerBuf, seedPlayerBuf)` — `(last_8_bytes_u64(a) + last_8_bytes_u64(b)) % 37`
- `prepareCircuitInputs()` — Formats inputs as decimal strings for snarkjs
- Seed is restricted to <2^32 to avoid u64 overflow in wrapping addition

### `lib/proof.js`

- `generateProof(inputs, wasmPath, zkeyPath)` — Calls `snarkjs.groth16.fullProve()`
- `proofToBytes(proof, publicSignals)` — Serializes to 384-byte hex (256 proof + 128 public inputs)
- G2 point byte order matches snarkjs output (c0|c1); the swap to Soroban's c1|c0 happens in `contracts/common/src/zk.rs`

## Pitfalls

- **In-memory state** — The active round seed is stored in memory only. If the process crashes mid-round, the seed is lost and the player can claim timeout after ~100 ledgers (~8 min)
- **No persistent storage** — No database or file-based recovery; the bot relies on transient retry
- **CLI dependency** — Requires `stellar` CLI binary; no Stellar SDK is used directly
- **Graceful shutdown** — SIGINT handler warns about in-flight rounds but cannot persist state
