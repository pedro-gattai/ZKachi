#!/bin/bash
# Generate a Groth16 proof for the roulette circuit
# Prerequisites: compile.sh and setup.sh have been run

set -e

CIRCUIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${CIRCUIT_DIR}/build"
INPUT_FILE="${1:-${CIRCUIT_DIR}/input.json}"

echo "=== Generating ZKachi Roulette Proof ==="
echo "Input: ${INPUT_FILE}"

# First, compute the correct input.json with Poseidon hash
# The commit field needs to be Poseidon(seed_cranker, salt)
# For testing, we compute this off-chain and update input.json

# Generate witness
echo "Generating witness..."
node "${BUILD_DIR}/roulette_js/generate_witness.js" \
    "${BUILD_DIR}/roulette_js/roulette.wasm" \
    "${INPUT_FILE}" \
    "${BUILD_DIR}/witness.wtns"

# Generate proof
echo "Generating Groth16 proof..."
snarkjs groth16 prove \
    "${BUILD_DIR}/roulette_final.zkey" \
    "${BUILD_DIR}/witness.wtns" \
    "${BUILD_DIR}/proof.json" \
    "${BUILD_DIR}/public.json"

# Verify proof locally
echo "Verifying proof locally..."
snarkjs groth16 verify \
    "${BUILD_DIR}/verification_key.json" \
    "${BUILD_DIR}/public.json" \
    "${BUILD_DIR}/proof.json"

echo "=== Proof generated and verified ==="
echo "  Proof:   ${BUILD_DIR}/proof.json"
echo "  Public:  ${BUILD_DIR}/public.json"

# Export proof for Soroban (raw bytes)
echo ""
echo "To use with Soroban, convert proof.json + public.json to raw bytes"
echo "following the xray-games format (256 bytes proof + N*32 bytes inputs)"
