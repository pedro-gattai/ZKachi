#!/bin/bash
# Groth16 trusted setup for the roulette circuit
# Prerequisites: snarkjs installed (npm install -g snarkjs)
# Prerequisites: compile.sh has been run

set -e

CIRCUIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${CIRCUIT_DIR}/build"

echo "=== Groth16 Trusted Setup ==="

# Phase 1: Powers of Tau (BN128)
echo "Phase 1: Powers of Tau..."
snarkjs powersoftau new bn128 14 "${BUILD_DIR}/pot14_0000.ptau" -v
snarkjs powersoftau contribute "${BUILD_DIR}/pot14_0000.ptau" "${BUILD_DIR}/pot14_0001.ptau" \
    --name="ZKachi contribution" -v -e="random entropy for zkachi"
snarkjs powersoftau prepare phase2 "${BUILD_DIR}/pot14_0001.ptau" "${BUILD_DIR}/pot14_final.ptau" -v

# Phase 2: Circuit-specific setup
echo "Phase 2: Circuit-specific setup..."
snarkjs groth16 setup "${BUILD_DIR}/roulette.r1cs" "${BUILD_DIR}/pot14_final.ptau" \
    "${BUILD_DIR}/roulette_0000.zkey"
snarkjs zkey contribute "${BUILD_DIR}/roulette_0000.zkey" "${BUILD_DIR}/roulette_final.zkey" \
    --name="ZKachi phase2" -v -e="more random entropy"

# Export verification key
echo "Exporting verification key..."
snarkjs zkey export verificationkey "${BUILD_DIR}/roulette_final.zkey" \
    "${BUILD_DIR}/verification_key.json"

echo "=== Setup complete ==="
echo "  Final zkey: ${BUILD_DIR}/roulette_final.zkey"
echo "  VK:         ${BUILD_DIR}/verification_key.json"
echo ""
echo "Next: Update contracts/verifier/src/circuit.rs with the verification key values"
echo "Then: Run scripts/prove.sh to generate a test proof"
