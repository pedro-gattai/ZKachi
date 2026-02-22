# ZKachi — Zero Knowledge Casino on Stellar

> **bet private, win public**

Fully on-chain ZK-powered roulette protocol on Stellar. No operators, no servers, no trust. The "house" is a collective liquidity pool — anyone can be the casino. Every round is verified with Zero-Knowledge proofs using Stellar's Protocol 25 (BN254 + Poseidon).

---

## Hackathon

- **Event:** ZK Gaming on Stellar
- **Deadline:** February 23, 2026
- **Prize Pool:** $10,000 in XLM
- **Hub Contract:** `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`
- **Game Studio:** https://github.com/jamesbachini/Stellar-Game-Studio

---

## What We're Building

A European roulette (0-36) where:

1. **ZK Proofs** guarantee every spin is mathematically fair — no trust required
2. **Liquidity Pool as the House** — anyone deposits XLM, becomes a casino co-owner, earns yield from house edge
3. **Fully On-chain** — no servers, no operators, no off-chain dependencies. All logic lives in Soroban contracts
4. **Cranker model** — anyone can run rounds permissionlessly. No centralized dealer

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      HUB CONTRACT                        │
│              (hackathon — already deployed)               │
│           start_game() / end_game()                      │
│    CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG │
└──────────────┬──────────────────────┬────────────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌────────▼──────────┐
    │   ROULETTE.rs       │  │    POOL.rs        │
    │                     │  │                   │
    │ • commit_round()    │  │ • deposit()       │
    │ • place_bet()       │◂▸│ • withdraw()      │
    │ • reveal_settle()   │  │ • payout()        │
    │ • claim_timeout()   │  │ • absorb()        │
    │                     │  │ • get_max_bet()   │
    └──────────┬──────────┘  └───────────────────┘
               │
       ┌───────▼───────────┐
       │   VERIFIER.rs     │
       │                   │
       │ • verify_proof()  │
       │ • BN254 ops       │
       │ • Poseidon check  │
       └───────────────────┘
```

---

## Game Flow — How a Round Works

### Phase 1: COMMIT
```
Cranker generates seed_c (random) off-chain
Cranker computes: commit = Poseidon(seed_c, salt)
Cranker calls: roulette.commit_round(commit, bond)
→ Bond is deposited as guarantee (cranker loses it if they don't reveal)
→ Betting window opens
→ hub.start_game() is called
```

### Phase 2: BET
```
Player sees the commit hash on-chain (can't derive seed_c from it)
Player generates their own seed_j (random)
Player calls: roulette.place_bet(bet_type, bet_value, seed_j, amount)
→ Bet is stored on-chain
→ Betting window closes for this round (1 player per round in MVP)
→ At this point: nobody knows the final result
   - Cranker committed before the bet (can't change)
   - Player doesn't know seed_c (only sees hash)
   - Result depends on BOTH seeds
```

### Phase 3: REVEAL + SETTLE
```
Cranker generates ZK proof proving:
  1. Poseidon(seed_c, salt) == commit (they knew the seed before bet)
  2. resultado = (seed_c + seed_j) % 37 (result is deterministic)
  3. 0 ≤ resultado ≤ 36 (valid range)

Cranker calls: roulette.reveal_and_settle(seed_c, proof)
→ Contract verifies ZK proof on-chain (BN254 from Protocol 25)
→ If proof invalid: revert
→ Computes: resultado = (seed_c + seed_j) % 37
→ Checks if player won based on bet_type + bet_value
→ If player won: pool.payout(player, bet * multiplier)
→ If player lost: pool.absorb(bet)
→ Returns bond to cranker + pays cranker_fee
→ hub.end_game() is called
→ Emits event with result + proof for public verification
```

### Phase TIMEOUT (safety)
```
If cranker doesn't reveal within TIMEOUT_LEDGERS:
→ Player calls: roulette.claim_timeout()
→ Player gets bet back + cranker's bond (punishment)
→ Round is closed
→ Cranker was likely trying to cheat (saw unfavorable result, refused to reveal)
```

---

## Smart Contracts — Detailed Spec

### pool.rs — The Collective Bankroll

```rust
// === STORAGE ===
// pool_balance: u128        — total XLM in the pool
// total_shares: u128        — total LP shares minted
// lp_shares: Map<Address, u128> — shares per LP
// protocol_fee_bps: u32     — protocol fee in basis points (0 for hackathon)
// cranker_fee_bps: u32      — cranker fee in basis points

// === CONSTANTS ===
// MAX_BET_RATIO: 2          — max bet = 2% of pool (variance protection)
// MIN_DEPOSIT: 10 XLM       — minimum LP deposit

// === PUBLIC FUNCTIONS ===

fn deposit(env: Env, lp: Address, amount: u128)
    // LP deposits XLM into the pool
    // Calculates shares: if pool empty → shares = amount (1:1)
    //                    else → shares = amount * total_shares / pool_balance
    // Mints shares to LP
    // Transfers XLM from LP to pool contract
    // Updates pool_balance and total_shares

fn withdraw(env: Env, lp: Address, shares: u128)
    // LP burns shares to get proportional XLM back
    // Calculates: xlm_out = shares * pool_balance / total_shares
    // Burns shares from LP
    // Transfers xlm_out from pool to LP
    // Updates pool_balance and total_shares

fn get_max_bet(env: Env) -> u128
    // Returns pool_balance * MAX_BET_RATIO / 100
    // This is the maximum a player can bet in a single round

fn get_pool_balance(env: Env) -> u128
fn get_total_shares(env: Env) -> u128
fn get_lp_shares(env: Env, lp: Address) -> u128
fn get_share_price(env: Env) -> u128
    // Returns pool_balance * PRECISION / total_shares
    // Shows how much 1 share is worth in XLM

// === INTERNAL (called only by roulette contract) ===

fn payout(env: Env, winner: Address, amount: u128)
    // Called when player wins
    // Transfers amount from pool to winner
    // pool_balance -= amount

fn absorb(env: Env, amount: u128)
    // Called when player loses
    // pool_balance += amount
    // total_shares stays the same → each share is now worth more
    // THIS IS HOW LPs PROFIT
```

**The shares magic:** When the pool absorbs a player loss, `pool_balance` goes up but `total_shares` stays the same. Each share becomes worth more XLM. LPs profit passively — exactly like DEX LP tokens appreciating from fees.

### roulette.rs — The Game Logic

```rust
// === STORAGE ===
// current_round: Round {
//   id: u64,
//   cranker: Address,
//   commit: BytesN<32>,
//   bond: u128,
//   bet: Option<Bet>,
//   status: RoundStatus (Open | BetPlaced | Settled | TimedOut),
//   commit_ledger: u32,
// }
// round_counter: u64
// pool_contract: Address
// verifier_contract: Address
// hub_contract: Address

// === CONSTANTS ===
// TIMEOUT_LEDGERS: 100      — ~8 minutes on Stellar
// MIN_BOND: 50 XLM          — minimum cranker bond
// CRANKER_FEE_BPS: 1000     — 10% of house edge goes to cranker

// === TYPES ===

enum BetType {
    Straight(u8),   // Exact number (0-36) → pays 35:1
    Red,            // Red numbers → pays 1:1
    Black,          // Black numbers → pays 1:1
    Even,           // Even (2,4,6...) → pays 1:1
    Odd,            // Odd (1,3,5...) → pays 1:1
    Low,            // 1-18 → pays 1:1
    High,           // 19-36 → pays 1:1
    Dozen(u8),      // 1-12, 13-24, 25-36 → pays 2:1
}

struct Bet {
    player: Address,
    bet_type: BetType,
    bet_value: u32,
    amount: u128,
    seed_player: BytesN<32>,
}

// Red numbers in European roulette
const RED_NUMBERS: [u8; 18] = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

// === PUBLIC FUNCTIONS ===

fn commit_round(env: Env, cranker: Address, commit: BytesN<32>, bond: u128)
    // Cranker opens a new round
    // Requires: no active round, bond >= MIN_BOND
    // Stores commit hash and cranker address
    // Transfers bond from cranker to contract
    // Calls hub.start_game()
    // Sets status = Open
    // Records commit_ledger for timeout calculation

fn place_bet(env: Env, player: Address, bet_type: BetType, seed_player: BytesN<32>, amount: u128)
    // Player places bet
    // Requires: round status == Open
    // Requires: amount <= pool.get_max_bet()
    // Requires: potential payout <= pool can cover
    //   → For Straight: amount * 35 <= pool_balance
    //   → For Red/Black/Even/Odd/Low/High: amount <= pool_balance
    //   → For Dozen: amount * 2 <= pool_balance
    // Transfers amount from player to contract (escrow)
    // Stores bet details
    // Sets status = BetPlaced

fn reveal_and_settle(env: Env, cranker: Address, seed_cranker: Field, proof: Bytes)
    // Cranker reveals seed and submits ZK proof
    // Requires: round status == BetPlaced
    // Requires: caller == round.cranker

    // Step 1: Verify ZK proof on-chain
    // verifier.verify_proof(proof, public_inputs: [commit, seed_cranker, seed_player, resultado])
    // If invalid → revert (cranker is cheating)

    // Step 2: Compute result
    // resultado = (seed_cranker + seed_player) % 37

    // Step 3: Check win condition
    // match bet_type:
    //   Straight(n) → won if resultado == n, payout = amount * 36 (35:1 + original)
    //   Red         → won if resultado in RED_NUMBERS, payout = amount * 2
    //   Black       → won if resultado not in RED_NUMBERS and resultado != 0, payout = amount * 2
    //   Even        → won if resultado % 2 == 0 and resultado != 0, payout = amount * 2
    //   Odd         → won if resultado % 2 == 1, payout = amount * 2
    //   Low         → won if 1 <= resultado <= 18, payout = amount * 2
    //   High        → won if 19 <= resultado <= 36, payout = amount * 2
    //   Dozen(1)    → won if 1 <= resultado <= 12, payout = amount * 3
    //   Dozen(2)    → won if 13 <= resultado <= 24, payout = amount * 3
    //   Dozen(3)    → won if 25 <= resultado <= 36, payout = amount * 3

    // Step 4: Settle
    // If player won:
    //   pool.payout(player, payout)
    //   return escrowed bet to player too
    // If player lost:
    //   pool.absorb(escrowed bet)
    //   calculate cranker_fee from absorbed amount
    //   pay cranker_fee to cranker

    // Step 5: Cleanup
    // Return bond to cranker
    // Calls hub.end_game()
    // Sets status = Settled
    // Emit event: RoundSettled { round_id, resultado, player_won, payout, proof_hash }

fn claim_timeout(env: Env, player: Address)
    // Safety mechanism if cranker disappears
    // Requires: round status == BetPlaced
    // Requires: current_ledger > commit_ledger + TIMEOUT_LEDGERS
    // Returns bet to player
    // Transfers cranker bond to player (punishment)
    // Sets status = TimedOut
    // Calls hub.end_game()

fn get_current_round(env: Env) -> Round
fn get_round_history(env: Env, round_id: u64) -> Round
```

### verifier.rs — Groth16 ZK Proof Verification (BN254 Native)

```rust
// Uses Protocol 25 BN254 elliptic-curve operations (native pairings)
// Following xray-games pattern: Circom + snarkjs + Groth16

fn init(env: Env, admin: Address)
    // Constructor — stores admin

fn verify(env: Env, proof: Bytes) -> bool
    // Extracts raw proof (256 bytes) + public inputs (4 * 32 bytes) from proof blob
    // Verification key is a static const (not stored on-chain)
    // Calls verify_groth16() from common::zk using BN254 pairing check
    // public_inputs = [commit, seed_cranker, seed_player, resultado]
    // Handles snarkjs G2 byte reordering (c0|c1 → c1|c0)
    // Returns true if proof is valid
```

---

## ZK Circuit — Circom + Groth16 Implementation

> **Decision:** Using Circom + Groth16 instead of Noir. Groth16 verification is **native** on Stellar via BN254 pairings (Protocol 25). The `xray-games` project is already deployed on mainnet with this approach. Noir currently lacks native support on Stellar.

```circom
// circuits/roulette/roulette.circom

pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template Roulette() {
    // === Public inputs (visible to everyone, verified on-chain) ===
    signal input commit;            // Poseidon(seed_cranker, salt) committed before bet
    signal input seed_cranker;      // Cranker's seed (revealed after bet)
    signal input seed_player;       // Player's seed (submitted with bet)
    signal input resultado;         // The roulette result (0-36)

    // === Private inputs (only the prover/cranker knows) ===
    signal input salt;              // Salt used in the commit

    // PROOF 1: Commit is valid
    component hasher = Poseidon(2);
    hasher.inputs[0] <== seed_cranker;
    hasher.inputs[1] <== salt;
    commit === hasher.out;

    // PROOF 2: Result is in valid range (0 <= resultado <= 36)
    component leq = LessEqThan(6);
    leq.in[0] <== resultado;
    leq.in[1] <== 36;
    leq.out === 1;

    // PROOF 3: Result was computed correctly from both seeds
    signal combined <== seed_cranker + seed_player;
    // resultado == combined % 37 (constrained via quotient)
    signal quotient;
    quotient <-- combined \ 37;
    resultado === combined - quotient * 37;
    // Range check quotient to prevent overflow attacks
    component quotientCheck = LessEqThan(252);
    quotientCheck.in[0] <== quotient;
    quotientCheck.in[1] <== (1 << 252) - 1;
    quotientCheck.out === 1;
}

component main {public [commit, seed_cranker, seed_player, resultado]} = Roulette();
```

**What this proof guarantees:**
- Cranker knew seed_cranker before the player bet (commit matches)
- Result is between 0 and 36 (valid roulette number)
- Result was deterministically computed from BOTH seeds (no manipulation)
- Neither party could predict or control the outcome alone

---

## Revenue Model

### Where money comes from

European roulette has a built-in house edge of **2.7%** — when zero (0) hits, all even-money bets lose. For straight bets, it pays 35:1 but there are 37 numbers: (37-36)/37 = 2.7%.

This isn't a "fee" — it's the mathematics of the game. Players know the odds before betting.

### Revenue distribution (Hackathon MVP)

```
House Edge per bet (~2.7%)
         │
         ├── 90% → Pool (appreciates LP shares)
         │         LPs earn passive yield proportional to their shares
         │
         └── 10% → Cranker fee
                   Incentive to keep rounds spinning
```

### Revenue distribution (Production / Solana)

```
House Edge per bet (~2.7%)
         │
         ├── 70% → Pool (LPs)
         │
         ├── 20% → Protocol treasury (ZKachi team)
         │         Funds development, audits, infrastructure
         │
         └── 10% → Cranker fee
```

### Example numbers

```
Pool: 100,000 XLM
Daily volume: 50,000 XLM in bets (conservative — 50% of pool)
House edge: 2.7%

Daily gross revenue: 50,000 × 2.7% = 1,350 XLM

MVP split:
  → Pool (LPs): 1,215 XLM/day
  → Crankers:    135 XLM/day

LP APY: (1,215 × 365) / 100,000 = ~443% APY

Production split (with protocol fee):
  → Pool (LPs):  945 XLM/day → ~344% APY
  → Protocol:    270 XLM/day → ~$98K/year at $1/XLM
  → Crankers:    135 XLM/day
```

---

## Security Model

### Against cheating player
Player doesn't know seed_cranker (only sees the Poseidon hash). Cannot predict the result before betting. Cannot reverse Poseidon to find the seed.

### Against cheating cranker
Cranker committed seed BEFORE the bet. Cannot change it after seeing the player's bet. If cranker refuses to reveal (because result is unfavorable), they lose their bond AND the player gets their bet back.

### Against cranker+player collusion
max_bet = 2% of pool. Even if they collude, maximum damage per round is capped. ZK proof guarantees result follows the formula — can't "choose" a result.

### Against pool drain
max_bet automatically decreases as pool shrinks (2% of smaller pool = smaller max bet). System is self-regulating. Statistical edge means pool grows over time.

---

## Project Structure

```
ZKachi/
├── plan.md                          # Spec detalhada
├── zkachi-brand-v2.html             # Brand guide
├── Cargo.toml                       # Workspace root (sem [package])
├── .gitignore                       # Rust/Soroban ignores
├── Makefile                         # Build, test, deploy
│
├── contracts/
│   ├── common/                      # Tipos compartilhados + ZK utils (rlib, NÃO deploy)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs               # Re-exports dos módulos
│   │       ├── types.rs             # BetType, Round, RoundStatus, Bet
│   │       ├── constants.rs         # RED_NUMBERS, timeouts, payouts
│   │       └── zk.rs               # verify_groth16(), poseidon hash helpers
│   │
│   ├── pool/                        # Pool contract (cdylib)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs               # deposit, withdraw, payout, absorb, getters
│   │       ├── storage.rs           # DataKey enum + helpers
│   │       └── test.rs              # Unit tests
│   │
│   ├── roulette/                    # Roulette contract (cdylib)
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs               # commit_round, place_bet, reveal_and_settle, claim_timeout
│   │       ├── storage.rs           # DataKey enum + helpers
│   │       ├── settlement.rs        # Win conditions + payout calc (pure functions)
│   │       └── test.rs              # Unit tests
│   │
│   └── verifier/                    # Verifier contract (cdylib)
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs               # verify() — Groth16 via BN254 pairings
│           ├── circuit.rs           # Static verification key + proof extraction
│           └── test.rs              # Unit tests
│
├── circuits/
│   └── roulette/                    # Circom circuit (Groth16)
│       ├── roulette.circom          # Circuito: Poseidon commit + resultado deterministico
│       ├── input.json               # Inputs de teste
│       └── scripts/
│           ├── compile.sh           # circom compile → wasm + r1cs
│           ├── setup.sh             # trusted setup (Groth16)
│           └── prove.sh             # gerar prova
│
├── scripts/
│   ├── deploy.sh                    # Deploy 3 contratos no testnet
│   ├── init.sh                      # Inicializa contratos com cross-references
│   ├── seed-pool.sh                 # Seed liquidez inicial
│   └── play-round.sh               # Teste full round via CLI
│
└── frontend/                        # (futuro, mas OBRIGATÓRIO para submission)
```

---

## Development Plan — Day by Day

### Day 1 — Sunday Feb 16 — Setup + ZK Circuit

**Goal:** ZK circuit generating and verifying proofs locally.

- [ ] Fork Stellar Game Studio repo
- [ ] Setup Circom environment (`circom` CLI + `snarkjs`)
- [ ] Implement roulette circuit (`circuits/roulette/roulette.circom`)
  - Poseidon commit verification
  - Range check (0-36)
  - Deterministic result computation
- [ ] Write circuit scripts — compile, trusted setup, generate proof locally
- [ ] Setup Soroban project structure (3 contracts)
- [ ] Initialize all Cargo.toml files with dependencies

**End of day checkpoint:** `circom` compiles circuit, `snarkjs groth16 prove` and `snarkjs groth16 verify` working locally.

---

### Day 2 — Monday Feb 17 — Pool + Roulette Contracts

**Goal:** Core contracts compiled and passing unit tests.

- [ ] Implement `pool.rs`:
  - deposit / withdraw / shares math
  - payout / absorb (internal)
  - get_max_bet, get_pool_balance, get_share_price
- [ ] Implement `roulette.rs` (without ZK verification):
  - commit_round
  - place_bet with all BetType variants
  - Win condition logic for all bet types
  - claim_timeout
- [ ] Write unit tests for pool math (especially edge cases: first deposit, empty pool, max withdraw)
- [ ] Write unit tests for bet validation and win conditions
- [ ] Deploy pool + roulette to testnet (without verifier, using mock verification)

**End of day checkpoint:** Can deposit to pool, place a bet, and settle (with mock verify) on testnet.

---

### Day 3 — Tuesday Feb 18 — ZK Verifier On-chain

**Goal:** ZK proof verification working on Stellar testnet via Protocol 25.

- [ ] Implement `verifier.rs`:
  - BN254 operations using Protocol 25 host functions
  - Poseidon hash computation on-chain
  - Full proof verification logic
- [ ] Integrate snarkjs Groth16 proof output format → Soroban verifier input format
  - Handle G2 byte reordering (snarkjs c0|c1 → Soroban c1|c0)
  - Extract proof (256 bytes) + public inputs from snarkjs output
- [ ] Connect verifier to roulette contract (replace mock)
- [ ] Test full flow: generate proof off-chain → verify on-chain
- [ ] Handle edge case: invalid proof → revert

**End of day checkpoint:** `reveal_and_settle` verifying a real Circom/Groth16 ZK proof on Stellar testnet.

**⚠️ This is the highest-risk day.** If Protocol 25 primitives don't work as expected, fallback plan:
- Option A: Use optimistic verification with dispute window
- Option B: Verify Poseidon commit on-chain, verify full proof off-chain with on-chain hash reference

---

### Day 4 — Wednesday Feb 19 — Settlement + Hub Integration

**Goal:** Complete game loop working end-to-end with real money flow.

- [ ] Implement full settlement logic in `reveal_and_settle`:
  - Compute result from both seeds
  - Calculate payout based on bet type
  - Call pool.payout() or pool.absorb()
  - Pay cranker fee
  - Return bond
- [ ] Integrate with hub contract:
  - Call `start_game()` in `commit_round`
  - Call `end_game()` in `reveal_and_settle` and `claim_timeout`
- [ ] Test scenarios:
  - Player wins straight bet (35:1 payout)
  - Player wins color bet (1:1 payout)
  - Player loses
  - Cranker timeout → player gets bet + bond
  - Bet exceeds max_bet → rejected
  - Payout exceeds pool → rejected
- [ ] Deploy updated contracts to testnet

**End of day checkpoint:** Can play a full round via CLI — commit → bet → reveal → payout, all verified, all on-chain.

---

### Day 5 — Thursday Feb 20 — Cranker Bot + Stress Testing

**Goal:** Automated cranker + battle-tested contracts.

- [ ] Build simple cranker bot (Node.js or Python):
  - Watches for bet events
  - Generates seed, commits
  - After bet: generates Noir proof, calls reveal_and_settle
  - Auto-restarts new rounds
  - Handles errors gracefully
- [ ] Stress test with multiple sequential rounds (20+)
- [ ] Test variance scenarios:
  - Player wins 5x in a row (pool drains → max_bet shrinks)
  - Player loses 10x in a row (pool grows → share price goes up)
  - LP deposits and withdraws mid-game
- [ ] Fix any bugs found during stress testing
- [ ] Verify all events are emitting correctly for frontend

**End of day checkpoint:** Cranker bot running autonomously, 20+ rounds completed without issues.

---

### Day 6 — Friday Feb 21 — Frontend + Polish

**Goal:** Playable demo with minimal UI.

- [ ] Minimal frontend (React or vanilla JS, following brand guide):
  - Connect Freighter wallet
  - Deposit/Withdraw as LP (with pool stats)
  - Place bet (select bet type, amount)
  - See result + proof verification status
  - Round history
- [ ] Integrate with Stellar Game Studio frontend template
- [ ] Final contract polish:
  - Clean up error messages
  - Add natspec-style comments
  - Ensure all events are comprehensive
- [ ] Deploy final version of all contracts to testnet
- [ ] Seed pool with test XLM

**End of day checkpoint:** Someone can open the frontend, connect wallet, deposit as LP, play roulette, and verify the ZK proof.

---

### Day 7 — Saturday Feb 22 — Video + Submission

**Goal:** Everything submitted.

- [ ] Write comprehensive README.md:
  - Project description
  - Architecture diagram
  - How ZK is used (essential, not decorative)
  - How to run locally
  - Contract addresses on testnet
  - Team info
- [ ] Record 2-3 minute video demo showing:
  - 0:00-0:30 — Problem statement (casinos aren't fair, ZKasino rugged $33M)
  - 0:30-1:00 — Solution overview (ZK proofs + LP pool as house)
  - 1:00-2:00 — Live gameplay demo (deposit as LP → place bet → see ZK verification → payout)
  - 2:00-2:30 — Technical explanation (Noir circuit, Soroban contracts, Protocol 25)
  - 2:30-3:00 — Future vision (Solana expansion, more games, B2B protocol)
- [ ] Final testing of everything
- [ ] Submit to hackathon before deadline

**End of day checkpoint:** Submission complete. 🎲

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Protocol 25 BN254 ops buggy/limited | Medium | Critical | Day 3 fallback: optimistic verify + Poseidon commit on-chain |
| Noir proof too large for Soroban tx | Medium | High | Use UltraPlonk instead of Groth16, or split verification |
| Pool math edge case (rounding, overflow) | Medium | High | Extensive unit tests Day 2, use u128 everywhere |
| Frontend takes too long | High | Low | Bare minimum UI is fine — judges understand it's a hackathon |
| Cranker bot unreliable | Low | Medium | Can run rounds manually via CLI for demo |
| Hub contract integration issues | Low | Medium | Test integration Day 4, read hub contract source first |

## What's OUT of MVP scope

- Multiple simultaneous players (MVP = 1 player per round)
- Multiple bet types per round (MVP = 1 bet per round)
- On-chain round history beyond current round
- Tokenomics / governance
- Protocol fee (100% to pool + cranker for hackathon)
- Mobile responsive frontend
- Multiple games (only roulette)

## If running out of time — Priority cuts

**Never cut (required for submission):**
1. ZK proof working on-chain — this is the entire point
2. Hub contract integration (start_game/end_game) — mandatory requirement
3. Video demo — how judges evaluate
4. Working frontend (even if ugly)

**Cut if needed:**
5. Cranker bot → run rounds manually via CLI for demo
6. Pretty frontend → functional but ugly is fine
7. All bet types → support only Red/Black + Straight
8. Stress testing → test happy path thoroughly, skip edge cases

## Key Resources & References

- **Stellar Game Studio (repo):** https://github.com/jamesbachini/Stellar-Game-Studio
- **Stellar Game Studio (docs):** https://jamesbachini.github.io/Stellar-Game-Studio/
- **xray-games (ZK reference, Circom+Groth16):** https://github.com/fredericrezeau/xray-games
- **typezero (ZK reference, RiscZero):** https://github.com/jamesbachini/typezero
- **Soroban docs:** https://soroban.stellar.org/docs
- **Protocol 25 (X-Ray):** https://stellar.org/blog/developers/announcing-stellar-x-ray-protocol-25
- **Circom docs:** https://docs.circom.io/
- **snarkjs:** https://github.com/iden3/snarkjs
- **circomlib:** https://github.com/iden3/circomlib
- **Hub contract (testnet):** CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
- **Hub interface:** https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG?filter=interface
- **soroban-sdk:** v25.0.0
- **soroban-poseidon:** v25.0.0

---

*ZKachi — bet private, win public* 🎲