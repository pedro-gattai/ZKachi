// proof.js — ZK proof generation using snarkjs as a library
//
// Generates Groth16 proofs and converts them to the 384-byte hex format
// expected by the Soroban verifier contract.
//
// Layout (384 bytes = 768 hex chars):
//   [0..64]    pi_a   (G1: x 32B + y 32B)
//   [64..192]  pi_b   (G2: x0 32B + x1 32B + y0 32B + y1 32B)
//   [192..256] pi_c   (G1: x 32B + y 32B)
//   [256..384] public inputs (4 × 32B, big-endian)
//
// G2 byte order: snarkjs native (c0, c1). The c0↔c1 swap is done
// at runtime by common/zk.rs on the contract side.

const snarkjs = require("snarkjs");

/**
 * Generate a Groth16 proof.
 * @param {Object} inputs - Circuit inputs (decimal strings)
 * @param {string} wasmPath - Path to circuit .wasm file
 * @param {string} zkeyPath - Path to .zkey file
 * @returns {{ proof, publicSignals }}
 */
async function generateProof(inputs, wasmPath, zkeyPath) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    wasmPath,
    zkeyPath
  );
  return { proof, publicSignals };
}

/**
 * Convert decimal string to 32-byte big-endian hex.
 */
function decTo32Hex(decStr) {
  return BigInt(decStr).toString(16).padStart(64, "0");
}

/**
 * Convert G1 point [x, y, "1"] to 64-byte hex.
 */
function g1ToHex(point) {
  return decTo32Hex(point[0]) + decTo32Hex(point[1]);
}

/**
 * Convert G2 point [[x0,x1],[y0,y1],"1"] to 128-byte hex.
 * Keeps snarkjs native order (c0, c1) — swap done in contract.
 */
function g2ToHex(point) {
  return (
    decTo32Hex(point[0][0]) +
    decTo32Hex(point[0][1]) +
    decTo32Hex(point[1][0]) +
    decTo32Hex(point[1][1])
  );
}

/**
 * Convert snarkjs proof + publicSignals to 384-byte hex string.
 * @param {Object} proof - snarkjs proof object
 * @param {string[]} publicSignals - 4 public input strings
 * @returns {string} 768 hex chars (384 bytes)
 */
function proofToBytes(proof, publicSignals) {
  const proofHex =
    g1ToHex(proof.pi_a) + g2ToHex(proof.pi_b) + g1ToHex(proof.pi_c);

  const inputsHex = publicSignals.map((v) => decTo32Hex(v)).join("");

  const fullHex = proofHex + inputsHex;

  if (fullHex.length !== 768) {
    throw new Error(
      `Expected 768 hex chars (384 bytes), got ${fullHex.length}`
    );
  }

  return fullHex;
}

module.exports = { generateProof, proofToBytes };
