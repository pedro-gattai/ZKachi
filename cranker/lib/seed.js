// seed.js — Seed generation, Poseidon hash, result computation
//
// Mirrors the on-chain logic in contracts/roulette/src/lib.rs:
//   resultado = (last_8_bytes_as_u64(seed_cranker) + last_8_bytes_as_u64(seed_player)) % 37
//
// For the circuit, we use u64 values directly as field elements.
// We keep seed_cranker < 2^32 so the wrapping u64 add matches field addition.

const crypto = require("crypto");
const { buildPoseidon } = require("circomlibjs");

let poseidonInstance = null;

async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Generate a random seed_cranker and its Poseidon commitment.
 * Returns { seedCrankerU64, seedCrankerBuf, salt, commit }
 *
 * seedCrankerU64: random number < 2^32 (fits in u64 with no overflow risk)
 * seedCrankerBuf: 32-byte big-endian Buffer (zero-padded, value in last 8 bytes)
 * salt: random BigInt used as private input in the circuit
 * commit: Poseidon(seedCrankerU64, salt) as BigInt
 */
async function generateSeedAndCommit() {
  const poseidon = await getPoseidon();

  // Random u32 to avoid u64 wrapping overflow in (seed_cranker + seed_player)
  const seedCrankerU64 = BigInt(crypto.randomInt(1, 2 ** 32 - 1));

  // 32-byte buffer: value in last 8 bytes (big-endian u64)
  const seedCrankerBuf = Buffer.alloc(32, 0);
  seedCrankerBuf.writeBigUInt64BE(seedCrankerU64, 24);

  // Random salt (252-bit, fits in BN254 field)
  const saltBytes = crypto.randomBytes(31); // 248 bits, safe for BN254
  const salt = BigInt("0x" + saltBytes.toString("hex"));

  // Poseidon hash: commit = Poseidon(seedCrankerU64, salt)
  const hashOut = poseidon([seedCrankerU64, salt]);
  const commit = poseidon.F.toObject(hashOut);

  return { seedCrankerU64, seedCrankerBuf, salt, commit };
}

/**
 * Compute roulette result from two 32-byte seed buffers.
 * Mirrors: (last_8_bytes_as_u64(a) + last_8_bytes_as_u64(b)) % 37
 */
function computeResult(seedCrankerBuf, seedPlayerBuf) {
  const a = seedCrankerBuf.readBigUInt64BE(24);
  const b = seedPlayerBuf.readBigUInt64BE(24);
  // Wrapping u64 add: mask to 64 bits
  const combined = BigInt.asUintN(64, a + b);
  return Number(combined % 37n);
}

/**
 * Prepare circuit inputs for snarkjs.groth16.fullProve.
 * All values are decimal strings (snarkjs convention).
 */
function prepareCircuitInputs(seedCrankerU64, seedPlayerBuf, salt, commit) {
  const seedPlayerU64 = seedPlayerBuf.readBigUInt64BE(24);
  const combined = BigInt.asUintN(64, seedCrankerU64 + seedPlayerU64);
  const resultado = Number(combined % 37n);

  return {
    commit: commit.toString(),
    seed_cranker: seedCrankerU64.toString(),
    seed_player: seedPlayerU64.toString(),
    resultado: resultado.toString(),
    salt: salt.toString(),
  };
}

/**
 * Convert a BigInt commit to a 32-byte hex string (big-endian, zero-padded).
 */
function commitToHex(commit) {
  return commit.toString(16).padStart(64, "0");
}

module.exports = {
  generateSeedAndCommit,
  computeResult,
  prepareCircuitInputs,
  commitToHex,
  getPoseidon,
};
