#!/bin/bash
# Play a full roulette round via CLI
# This is a manual test — in production, the cranker bot automates this
# Prerequisites: pool is seeded, all contracts initialized

set -e

if [ ! -f .env ]; then
    echo "Error: .env not found. Run deploy.sh first."
    exit 1
fi

source .env

CRANKER=$(stellar keys address "${SOURCE}")
PLAYER=$(stellar keys address "${SOURCE}")  # Same account for testing

echo "=== ZKachi Roulette — Full Round Test ==="
echo "Cranker: ${CRANKER}"
echo "Player:  ${PLAYER}"

# Step 1: Commit
echo ""
echo "--- Phase 1: COMMIT ---"
echo "Cranker commits a seed hash..."

# Test vector (matches circuits/roulette/input.json):
#   seed_cranker=42, seed_player=13, salt=12345
#   commit = Poseidon(42, 12345)
#   resultado = (42 + 13) % 37 = 18
SEED_CRANKER="000000000000000000000000000000000000000000000000000000000000002a"  # 42
COMMIT="1d48994852892f8620bd5ebfe30ced36aae997fa307812faf30cbfaf8c27f7f5"       # Poseidon(42, 12345)
BOND="500000000"  # 50 XLM min bond

stellar contract invoke \
    --id "${ROULETTE_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    commit_round \
    --cranker "${CRANKER}" \
    --commit "${COMMIT}" \
    --bond "${BOND}"

echo "Round committed!"

# Step 2: Place Bet
echo ""
echo "--- Phase 2: BET ---"
echo "Player bets on Red..."

SEED_PLAYER="000000000000000000000000000000000000000000000000000000000000000d"  # 13
BET_AMOUNT="10000000"  # 1 XLM

stellar contract invoke \
    --id "${ROULETTE_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    place_bet \
    --player "${PLAYER}" \
    --bet_type '{"Red":{}}' \
    --seed_player "${SEED_PLAYER}" \
    --amount "${BET_AMOUNT}"

echo "Bet placed!"

# Step 3: Reveal and Settle
echo ""
echo "--- Phase 3: REVEAL + SETTLE ---"
echo "Cranker reveals seed and submits ZK proof..."

# Generate proof bytes from the circuit build output
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROOF_HEX=$(node "${SCRIPT_DIR}/proof-to-bytes.js" 2>/dev/null | head -2 | tail -1)

if [ -z "${PROOF_HEX}" ]; then
    echo "ERROR: Could not generate proof bytes."
    echo "Run 'make circuit' first to compile circuit, run setup, and generate proof."
    exit 1
fi

echo "Proof hex (first 64 chars): ${PROOF_HEX:0:64}..."

stellar contract invoke \
    --id "${ROULETTE_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    reveal_and_settle \
    --cranker "${CRANKER}" \
    --seed_cranker "${SEED_CRANKER}" \
    --proof "${PROOF_HEX}"

echo "Round revealed and settled!"

# Check round state
echo ""
echo "--- Final Round State ---"
stellar contract invoke \
    --id "${ROULETTE_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    get_current_round

echo ""
echo "=== Full round complete (commit + bet + reveal) ==="
