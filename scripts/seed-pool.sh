#!/bin/bash
# Seed the ZKachi pool with initial liquidity
# Prerequisites: init.sh has been run

set -e

if [ ! -f .env ]; then
    echo "Error: .env not found. Run deploy.sh first."
    exit 1
fi

source .env

AMOUNT="${1:-10000000000}"  # Default: 1000 XLM (in stroops)
ADMIN=$(stellar keys address "${SOURCE}")

echo "=== Seeding ZKachi Pool ==="
echo "Depositing ${AMOUNT} stroops ($(echo "scale=2; ${AMOUNT}/10000000" | bc) XLM)..."

stellar contract invoke \
    --id "${POOL_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    deposit \
    --lp "${ADMIN}" \
    --amount "${AMOUNT}"

echo ""
echo "Pool balance:"
stellar contract invoke \
    --id "${POOL_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    get_pool_balance

echo ""
echo "Max bet:"
stellar contract invoke \
    --id "${POOL_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    get_max_bet

echo ""
echo "=== Pool Seeded ==="
