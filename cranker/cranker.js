#!/usr/bin/env node
// cranker.js — ZKachi Roulette Cranker Bot
//
// Automates the commit → reveal cycle:
//   IDLE → commit new round → COMMITTED (waiting for bet)
//   COMMITTED → bet detected → READY_REVEAL → generate proof → reveal_and_settle
//   Settled → back to IDLE
//
// State between commit and reveal is kept in memory. If the process crashes,
// the player can claim timeout after ~8 min (TIMEOUT_LEDGERS = 100).

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  generateSeedAndCommit,
  computeResult,
  prepareCircuitInputs,
  commitToHex,
} = require("./lib/seed");
const { generateProof, proofToBytes } = require("./lib/proof");
const {
  configure,
  getCurrentRound,
  getCurrentBet,
  commitRound,
  revealAndSettle,
  getCrankerAddress,
} = require("./lib/stellar");

// --- Config ---
const ROULETTE_ID = process.env.ROULETTE_ID;
const NETWORK = process.env.NETWORK || "testnet";
const SOURCE = process.env.SOURCE || "default";
const CRANKER_BOND = process.env.CRANKER_BOND || "500000000"; // 50 XLM
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "6000", 10);

// Circuit artifact paths
const CIRCUIT_DIR = path.join(__dirname, "..", "circuits", "roulette", "build");
const WASM_PATH = path.join(CIRCUIT_DIR, "roulette_js", "roulette.wasm");
const ZKEY_PATH = path.join(CIRCUIT_DIR, "roulette_final.zkey");

// --- State ---
let activeRound = null; // { seedCrankerU64, seedCrankerBuf, seedCrankerHex, salt, commit }
let crankerAddress = null;

// --- State Machine ---
const State = {
  IDLE: "IDLE",
  COMMITTED: "COMMITTED",
  READY_REVEAL: "READY_REVEAL",
};
let state = State.IDLE;

async function tick() {
  try {
    switch (state) {
      case State.IDLE:
        await handleIdle();
        break;
      case State.COMMITTED:
        await handleCommitted();
        break;
      case State.READY_REVEAL:
        await handleReveal();
        break;
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in state ${state}:`, err.message);
    // Transient errors: stay in current state, retry next tick
  }
}

async function handleIdle() {
  // Check if there's already an active round (e.g., from a previous crash)
  const round = getCurrentRound();
  if (round) {
    const status = parseStatus(round.status);
    if (status === "BetPlaced") {
      console.log(`[IDLE] Found active round with bet (status=BetPlaced). Cannot override — waiting for player to claim timeout (~8 min).`);
      return;
    }
    // Open, Settled, or TimedOut — commit_round handles cleanup
  }

  // Generate new seed and commit
  console.log("[IDLE] Generating new seed and commitment...");
  const { seedCrankerU64, seedCrankerBuf, salt, commit } =
    await generateSeedAndCommit();

  const seedCrankerHex = seedCrankerBuf.toString("hex");
  const commitHex = commitToHex(commit);

  console.log(`[IDLE] Committing round (seed_cranker_u64=${seedCrankerU64}, commit=${commitHex.slice(0, 16)}...)`);

  commitRound(crankerAddress, commitHex, CRANKER_BOND);

  activeRound = { seedCrankerU64, seedCrankerBuf, seedCrankerHex, salt, commit };
  state = State.COMMITTED;
  console.log("[COMMITTED] Round committed. Waiting for a bet...");
}

async function handleCommitted() {
  const round = getCurrentRound();
  if (!round) {
    console.log("[COMMITTED] Round disappeared (expired?). Returning to IDLE.");
    activeRound = null;
    state = State.IDLE;
    return;
  }

  const status = parseStatus(round.status);

  if (status === "BetPlaced") {
    console.log("[COMMITTED] Bet detected! Moving to READY_REVEAL.");
    state = State.READY_REVEAL;
    return;
  }

  if (status === "Settled" || status === "TimedOut") {
    console.log(`[COMMITTED] Round ended (${status}) without our reveal. Returning to IDLE.`);
    activeRound = null;
    state = State.IDLE;
    return;
  }

  // Still Open — keep waiting
}

async function handleReveal() {
  if (!activeRound) {
    console.error("[REVEAL] No active round state! Cannot reveal. Returning to IDLE.");
    state = State.IDLE;
    return;
  }

  // Read the bet to get seed_player
  const bet = getCurrentBet();
  if (!bet) {
    console.error("[REVEAL] No bet found on-chain. Returning to COMMITTED.");
    state = State.COMMITTED;
    return;
  }

  // Extract seed_player from the bet
  const seedPlayerHex = parseSeedPlayer(bet.seed_player);
  const seedPlayerBuf = Buffer.from(seedPlayerHex, "hex");

  const resultado = computeResult(activeRound.seedCrankerBuf, seedPlayerBuf);
  console.log(`[REVEAL] seed_player=${seedPlayerHex.slice(0, 16)}..., resultado=${resultado}`);

  // Prepare circuit inputs
  const inputs = prepareCircuitInputs(
    activeRound.seedCrankerU64,
    seedPlayerBuf,
    activeRound.salt,
    activeRound.commit
  );

  console.log("[REVEAL] Generating ZK proof...");
  const { proof, publicSignals } = await generateProof(inputs, WASM_PATH, ZKEY_PATH);
  const proofHex = proofToBytes(proof, publicSignals);
  console.log(`[REVEAL] Proof generated (${proofHex.length} hex chars). Submitting reveal_and_settle...`);

  revealAndSettle(crankerAddress, activeRound.seedCrankerHex, proofHex);

  console.log(`[REVEAL] Round settled! resultado=${resultado}`);
  activeRound = null;
  state = State.IDLE;
}

/**
 * Parse round status from Soroban JSON output.
 * Soroban enums serialize as either a string or {"EnumVariant": {}}.
 */
function parseStatus(status) {
  if (typeof status === "string") return status;
  if (typeof status === "object" && status !== null) {
    return Object.keys(status)[0];
  }
  return String(status);
}

/**
 * Parse seed_player from bet JSON.
 * Soroban BytesN<32> may serialize as hex string or base64.
 */
function parseSeedPlayer(raw) {
  if (typeof raw === "string") {
    // If it's already hex (64 chars)
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return raw;
    // Might be base64
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 32) return buf.toString("hex");
    // Try as plain hex without length check
    return raw;
  }
  throw new Error(`Cannot parse seed_player from: ${JSON.stringify(raw)}`);
}

// --- Main ---
async function main() {
  if (!ROULETTE_ID) {
    console.error("ERROR: ROULETTE_ID not set. Run deploy.sh first or check .env");
    process.exit(1);
  }

  configure({ rouletteId: ROULETTE_ID, network: NETWORK, source: SOURCE });

  crankerAddress = getCrankerAddress(SOURCE);
  console.log("=== ZKachi Cranker Bot ===");
  console.log(`  Address:  ${crankerAddress}`);
  console.log(`  Contract: ${ROULETTE_ID}`);
  console.log(`  Network:  ${NETWORK}`);
  console.log(`  Bond:     ${CRANKER_BOND} stroops`);
  console.log(`  Poll:     ${POLL_INTERVAL_MS}ms`);
  console.log("");
  console.log("Starting polling loop...");
  console.log("");

  // Graceful shutdown warning
  process.on("SIGINT", () => {
    if (activeRound) {
      console.warn("\nWARNING: Active round in progress! Seed will be lost.");
      console.warn("Player can claim timeout after ~8 min (100 ledgers).");
    }
    console.log("\nShutting down cranker bot.");
    process.exit(0);
  });

  // Polling loop
  while (true) {
    await tick();
    await sleep(POLL_INTERVAL_MS);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
