#!/bin/bash
# Verify ZKachi contracts are initialized correctly
# In SDK v25+, constructors run at deploy time via deploy.sh
# This script now serves as a health check.

set -e

if [ ! -f .env ]; then
    echo "Error: .env not found. Run deploy.sh first."
    exit 1
fi

source .env

echo "=== Verifying ZKachi Contracts ==="

# Check Hub
echo ""
echo "Checking Hub (${HUB_ID})..."
SESSIONS=$(stellar contract invoke \
    --id "${HUB_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    --send no \
    -- \
    get_total_sessions 2>&1 | tail -1)
echo "Hub total sessions: ${SESSIONS}"

# Check Pool
echo ""
echo "Checking Pool (${POOL_ID})..."
BALANCE=$(stellar contract invoke \
    --id "${POOL_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    --send no \
    -- \
    get_pool_balance 2>&1 | tail -1)
echo "Pool balance: ${BALANCE}"

# Check Roulette
echo ""
echo "Checking Roulette (${ROULETTE_ID})..."
COUNTER=$(stellar contract invoke \
    --id "${ROULETTE_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    --send no \
    -- \
    get_round_counter 2>&1 | tail -1)
echo "Roulette round counter: ${COUNTER}"

echo ""
echo "=== All contracts verified ==="
echo "Next: run scripts/seed-pool.sh to add initial liquidity"
