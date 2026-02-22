#!/bin/bash
# Deploy ZKachi contracts to Stellar testnet
# Prerequisites: stellar CLI installed, funded testnet account
#
# In Soroban SDK v25+, `stellar contract deploy` calls __constructor automatically.
# Deploy order handles circular dependency:
#   1. Hub (no deps)
#   2. Verifier (no deps)
#   3. Pool (no roulette yet — set later via set_roulette)
#   4. Roulette (needs pool, verifier, hub)
#   5. Call pool.set_roulette(roulette_id)

set -e

NETWORK="testnet"
SOURCE="${ZKACHI_DEPLOYER:-deployer}"

ADMIN=$(stellar keys address "${SOURCE}")

# Resolve native XLM SAC address dynamically
TOKEN="${XLM_TOKEN:-$(stellar contract id asset --asset native --network ${NETWORK})}"

echo "=== Deploying ZKachi Contracts to ${NETWORK} ==="
echo "Admin: ${ADMIN}"
echo "Token: ${TOKEN}"

# Build all contracts
echo ""
echo "Building contracts..."
stellar contract build

WASM_DIR="target/wasm32v1-none/release"

# 1. Deploy Hub
echo ""
echo "Deploying Hub contract..."
HUB_ID=$(stellar contract deploy \
    --wasm "${WASM_DIR}/hub.wasm" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    --admin "${ADMIN}" \
    2>&1 | tail -1)
echo "Hub: ${HUB_ID}"

# 2. Deploy Verifier
echo ""
echo "Deploying Verifier contract..."
VERIFIER_ID=$(stellar contract deploy \
    --wasm "${WASM_DIR}/verifier.wasm" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    --admin "${ADMIN}" \
    2>&1 | tail -1)
echo "Verifier: ${VERIFIER_ID}"

# 3. Deploy Pool (without roulette — set later)
echo ""
echo "Deploying Pool contract..."
POOL_ID=$(stellar contract deploy \
    --wasm "${WASM_DIR}/pool.wasm" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    --admin "${ADMIN}" \
    --token "${TOKEN}" \
    2>&1 | tail -1)
echo "Pool: ${POOL_ID}"

# 4. Deploy Roulette (needs pool, verifier, hub)
echo ""
echo "Deploying Roulette contract..."
ROULETTE_ID=$(stellar contract deploy \
    --wasm "${WASM_DIR}/roulette.wasm" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    --admin "${ADMIN}" \
    --pool "${POOL_ID}" \
    --verifier "${VERIFIER_ID}" \
    --hub "${HUB_ID}" \
    --token "${TOKEN}" \
    2>&1 | tail -1)
echo "Roulette: ${ROULETTE_ID}"

# 5. Link pool → roulette (resolves circular dependency)
echo ""
echo "Linking Pool to Roulette..."
stellar contract invoke \
    --id "${POOL_ID}" \
    --source "${SOURCE}" \
    --network "${NETWORK}" \
    -- \
    set_roulette \
    --roulette "${ROULETTE_ID}"
echo "Pool linked to Roulette"

echo ""
echo "=== Deployment Complete ==="
echo "HUB_ID=${HUB_ID}"
echo "POOL_ID=${POOL_ID}"
echo "VERIFIER_ID=${VERIFIER_ID}"
echo "ROULETTE_ID=${ROULETTE_ID}"

# Save to .env file
cat > .env <<EOF
HUB_ID=${HUB_ID}
POOL_ID=${POOL_ID}
VERIFIER_ID=${VERIFIER_ID}
ROULETTE_ID=${ROULETTE_ID}
NETWORK=${NETWORK}
SOURCE=${SOURCE}
XLM_TOKEN=${TOKEN}
EOF

echo ""
echo "Contract addresses saved to .env"
echo "Next: run scripts/seed-pool.sh to add initial liquidity"
