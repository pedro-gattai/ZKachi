# contracts/roulette — Game Logic

## What is this

The main roulette game contract. Manages the commit-reveal game flow, cross-contract calls to pool/verifier/hub, and settlement logic.

## Game flow

```
1. commit_round(cranker, commit, bond)
   - Cranker posts a hash commitment + bond (≥50 XLM)
   - Round created with status=Open
   - Hub notified via start_game()

2. place_bet(player, bet_type, seed_player, amount)
   - Player bets on the open round
   - Validates bet type, amount ≤ max_bet, pool can cover payout
   - Tokens transferred to escrow
   - Status → BetPlaced

3a. reveal_and_settle(cranker, seed_cranker, proof)
    - Cranker submits ZK proof
    - Verifier contract checks proof
    - resultado = (seed_cranker + seed_player) % 37
    - Settlement computed, tokens distributed
    - Bond returned to cranker

3b. claim_timeout(player)
    - If cranker doesn't reveal within TIMEOUT_LEDGERS (100)
    - Player gets bet back + cranker's bond
```

## Storage pattern

Defined in `storage.rs`:

| Key | Storage Type | Description |
|-----|-------------|-------------|
| `Admin`, `Pool`, `Verifier`, `Hub`, `Token` | Instance | Persistent config |
| `RoundCounter`, `HubSessionId` | Instance | Counters |
| `CurrentRound` | Temporary (TTL) | Active round state |
| `CurrentBet` | Temporary (TTL) | Active bet state |

Temporary storage uses `extend_ttl()` with `GAME_TTL_LEDGERS` (30 days).

## Cross-contract clients

Defined inline via `mod` blocks with `#[soroban_sdk::contractclient]`:

- **Pool:** `payout`, `absorb`, `get_max_bet`, `get_pool_balance`
- **Verifier:** `verify(proof: Bytes) -> bool`
- **GameHub:** `start_game(...)`, `end_game(session_id, player1_won, timed_out, bet_amount, result)` — `result` is the roulette number (0–36) or 37 for timeouts

## Settlement module (`settlement.rs`)

- `compute_settlement(resultado, bet_type, amount) -> SettlementResult`
- `check_win(resultado, bet_type) -> bool`
- `get_multiplier(bet_type) -> i128` (Straight=36, EvenMoney=2, Dozen=3)
- `is_red(n) -> bool` (uses RED_NUMBERS constant)
- On win: `payout = (multiplier - 1) * amount` from pool
- On loss: 90% to pool (absorb), 10% cranker fee

## Result computation

```rust
fn compute_result(seed_cranker, seed_player) -> u32 {
    // Last 8 bytes of each seed → u64
    // (cranker_val + player_val) % 37
}
```

## Testing

```bash
cargo test -p roulette
```

Tests in `test.rs` cover all settlement scenarios: straight win/loss, red/black, even/odd, low/high, dozen, zero edge case, and cranker fee math.

## Pitfalls

- `Round` and `StoredBet` are stored separately (Soroban struct size limitation)
- The zero (0) result loses all even-money bets — this is the house edge
- `BetType::Straight(n)` must be 0–36, `BetType::Dozen(n)` must be 1–3
- Bond goes to player on timeout (penalty for unresponsive cranker)
- Hub integration uses a session ID that increments per round
