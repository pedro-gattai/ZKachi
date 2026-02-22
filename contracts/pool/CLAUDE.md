# contracts/pool — Liquidity Pool

## What is this

A Soroban smart contract that manages the house liquidity for the roulette game. LPs deposit XLM and receive shares. When players lose, the pool absorbs their bets (increasing share price). When players win, the pool pays out.

## Storage pattern

Defined in `storage.rs` via `DataKey` enum:

| Key | Storage | Description |
|-----|---------|-------------|
| `Admin` | Instance | Contract admin address |
| `Token` | Instance | XLM SAC token address |
| `Roulette` | Instance | Roulette contract address (auth check) |
| `PoolBalance` | Instance | Total tokens held (i128) |
| `TotalShares` | Instance | Total LP shares issued (i128) |
| `LpShares(Address)` | Instance | Per-LP share balance (i128) |

## Shares math

- **First deposit:** 1 token = 1 share
- **Subsequent deposits:** `new_shares = amount * total_shares / pool_balance`
- **Withdrawal:** `tokens_out = shares * pool_balance / total_shares`
- **Share price:** `pool_balance * 10_000_000 / total_shares` (7 decimal places)
- **Absorb (player loss):** Pool balance increases without minting shares → share price goes up → LP profit

## Auth model

- `deposit` / `withdraw`: Require `lp.require_auth()`
- `payout` / `absorb`: Require `env.current_contract_address().require_auth()` — only callable by the roulette contract via cross-contract invocation
- `get_max_bet`: Returns `pool_balance * MAX_BET_RATIO_BPS / BPS_DENOMINATOR` (2% of pool)

## Key functions

- `deposit(lp, amount)` — LP adds liquidity, receives shares
- `withdraw(lp, shares)` — LP burns shares, receives proportional tokens
- `payout(winner, amount)` — Roulette sends winnings to player (decreases pool)
- `absorb(amount)` — Roulette tells pool to absorb a losing bet (increases pool)
- `get_max_bet()` — Returns 2% of pool balance

## Testing

```bash
cargo test -p pool
```

Tests in `test.rs` cover: first deposit ratio, proportional deposits, withdrawals, absorb effects on share price, max bet calculation, and zero-amount validation.

## Pitfalls

- `payout` and `absorb` must only be callable by roulette — the auth comes from cross-contract call context
- Pool balance is tracked separately from actual token balance (no `balance()` calls)
- Division truncation in share math is expected — no rounding adjustments
