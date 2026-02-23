## Video Demo Script

Structured for a ~2:30 walkthrough. Record screen + voiceover.

### Part 1 — Show the app (~40s)

- Open the landing page, briefly show the UI and animated wheel
- Connect wallet with Freighter
- Navigate to the Game page — show the betting board and game status panel

### Part 2 — Play a round live (~50s)

- Show the cranker running in a terminal (it commits a round automatically)
- On the frontend, place a bet (e.g. Red, 100 XLM)
- Watch the cranker detect the bet, generate the Groth16 ZK proof, and settle the round
- Show the result on the wheel + payout animation

### Part 3 — Explain the ZK (~40s)

- Navigate to the Verify page — show round data: commit hash, both seeds, result number
- Explain the flow: the cranker committed a hidden seed before the bet, the player added their own seed, the result is `(seed_cranker + seed_player) % 37`
- The Groth16 proof verified on-chain guarantees the math is correct — no trust needed
- Show the architecture diagram on the Docs page

### Part 4 — Pool + wrap up (~30s)

- Navigate to the Pool page — show LP deposits, share accounting, pool balance
- Mention: anyone can be the house. LPs earn passively from the 2.7% mathematical edge
- Close: *"Provably fair roulette on Stellar — no trust, just math."*
