#!/bin/bash
# Compile the Circom roulette circuit
# Prerequisites: npm install circomlib (in circuits/roulette/)
# Prerequisites: circom CLI installed (https://docs.circom.io/getting-started/installation/)

set -e

CIRCUIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${CIRCUIT_DIR}/build"

echo "=== Compiling ZKachi Roulette Circuit ==="

# Install circomlib if not present
if [ ! -d "${CIRCUIT_DIR}/node_modules/circomlib" ]; then
    echo "Installing circomlib..."
    cd "${CIRCUIT_DIR}"
    npm init -y 2>/dev/null || true
    npm install circomlib
fi

# Create build directory
mkdir -p "${BUILD_DIR}"

# Compile circuit
echo "Compiling roulette.circom..."
circom "${CIRCUIT_DIR}/roulette.circom" \
    --r1cs \
    --wasm \
    --sym \
    --output "${BUILD_DIR}"

echo "=== Compilation complete ==="
echo "  R1CS:  ${BUILD_DIR}/roulette.r1cs"
echo "  WASM:  ${BUILD_DIR}/roulette_js/roulette.wasm"
echo "  SYM:   ${BUILD_DIR}/roulette.sym"
