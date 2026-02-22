# contracts/hub — Game Hub

## What is this

A Soroban smart contract that tracks game sessions across the ZKachi platform. Called by game contracts (e.g., roulette) to register round starts and results.

## Functions

- `__constructor(admin)` — Initialize with admin address
- `start_game(game_id, session_id, player1, player2, player1_points, player2_points)` — Register a new game session
- `end_game(session_id, player1_won, timed_out, bet_amount, result)` — Mark session as finished with result (`timed_out=true` sets status to `TimedOut`, otherwise `Finished`). Stores `bet_amount` in `player2_points` and `result` (0–36 = roulette number, 37 = timeout/no result).
- `get_session(session_id) -> Option<GameSession>` — Query session data
- `get_total_sessions() -> u32` — Total sessions tracked

## Storage

| Key | Storage Type | Description |
|-----|-------------|-------------|
| `Admin` | Instance | Contract admin address |
| `Session(u32)` | Persistent | Game session data (with TTL) |
| `TotalSessions` | Instance | Session counter |

## Auth

Currently open — any contract can call `start_game`/`end_game`. In production, should restrict to registered game contracts.

## Testing

```bash
cargo test -p hub
```
