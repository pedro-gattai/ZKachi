#!/usr/bin/env node
// Convert snarkjs proof.json + public.json to a 384-byte hex string for Soroban.
//
// Output layout (384 bytes = 768 hex chars):
//   [0..64]    pi_a   (G1: x 32 bytes + y 32 bytes)
//   [64..192]  pi_b   (G2: x0 32 + x1 32 + y0 32 + y1 32)
//   [192..256] pi_c   (G1: x 32 bytes + y 32 bytes)
//   [256..384] public inputs (4 × 32 bytes, big-endian U256)
//
// G2 byte order matches snarkjs native output (c0, c1).
// The c0↔c1 swap for Soroban is handled at runtime by common/zk.rs.
//
// Usage:
//   node scripts/proof-to-bytes.js [proof_dir]
//   Default proof_dir: circuits/roulette/build

const fs = require("fs");
const path = require("path");

const buildDir =
  process.argv[2] ||
  path.join(__dirname, "..", "circuits", "roulette", "build");

const proof = JSON.parse(
  fs.readFileSync(path.join(buildDir, "proof.json"), "utf8")
);
const pub = JSON.parse(
  fs.readFileSync(path.join(buildDir, "public.json"), "utf8")
);

// Convert decimal string to 32-byte big-endian buffer
function decTo32Bytes(decStr) {
  let hex = BigInt(decStr).toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
}

// G1 point → 64 bytes (x, y)
function g1ToBytes(point) {
  return Buffer.concat([decTo32Bytes(point[0]), decTo32Bytes(point[1])]);
}

// G2 point → 128 bytes (x0, x1, y0, y1) in snarkjs native order
function g2ToBytes(point) {
  return Buffer.concat([
    decTo32Bytes(point[0][0]),
    decTo32Bytes(point[0][1]),
    decTo32Bytes(point[1][0]),
    decTo32Bytes(point[1][1]),
  ]);
}

// Build 256-byte proof: a(64) + b(128) + c(64)
const proofBytes = Buffer.concat([
  g1ToBytes(proof.pi_a),
  g2ToBytes(proof.pi_b),
  g1ToBytes(proof.pi_c),
]);

// Build 128-byte public inputs: 4 × 32 bytes
const inputBytes = Buffer.concat(pub.map((v) => decTo32Bytes(v)));

// Final 384-byte blob
const blob = Buffer.concat([proofBytes, inputBytes]);

if (blob.length !== 384) {
  console.error(`ERROR: expected 384 bytes, got ${blob.length}`);
  process.exit(1);
}

const hex = blob.toString("hex");

console.log("=== Proof Bytes (384 bytes / 768 hex chars) ===");
console.log(hex);
console.log("");
console.log(`Length: ${hex.length} hex chars (${blob.length} bytes)`);
console.log(
  `  pi_a:   ${proofBytes.subarray(0, 64).toString("hex").substring(0, 32)}...`
);
console.log(
  `  pi_b:   ${proofBytes.subarray(64, 192).toString("hex").substring(0, 32)}...`
);
console.log(
  `  pi_c:   ${proofBytes.subarray(192, 256).toString("hex").substring(0, 32)}...`
);
for (let i = 0; i < pub.length; i++) {
  console.log(
    `  pub[${i}]: ${inputBytes.subarray(i * 32, (i + 1) * 32).toString("hex")}`
  );
}
