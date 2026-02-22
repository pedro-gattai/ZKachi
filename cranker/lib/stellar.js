// stellar.js — Soroban contract interaction wrappers
//
// Uses `stellar contract invoke` via child_process.
// All mutations require the SOURCE identity to sign.

const { execFileSync } = require("child_process");

let config = {
  rouletteId: "",
  network: "testnet",
  source: "default",
};

function configure(opts) {
  Object.assign(config, opts);
}

/**
 * Run `stellar contract invoke` with the given method and args.
 * @param {string} method - Contract function name
 * @param {string[]} args - CLI args after `--`
 * @param {boolean} readOnly - If true, skip signing (simulate only)
 * @returns {string} stdout from the command
 */
function invoke(method, args, readOnly = false) {
  const cmd = [
    "contract",
    "invoke",
    "--id",
    config.rouletteId,
    "--network",
    config.network,
  ];

  if (!readOnly) {
    cmd.push("--source", config.source);
  } else {
    cmd.push("--source", config.source);
  }

  cmd.push("--", method, ...args);

  try {
    const result = execFileSync("stellar", cmd, {
      encoding: "utf-8",
      timeout: 60_000,
    });
    return result.trim();
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : "";
    const stdout = err.stdout ? err.stdout.toString() : "";
    throw new Error(
      `stellar invoke ${method} failed:\n${stderr || stdout || err.message}`
    );
  }
}

/**
 * Query the current round state.
 * @returns {Object|null} Parsed round or null if no round
 */
function getCurrentRound() {
  try {
    const raw = invoke("get_current_round", [], true);
    if (!raw || raw === "null" || raw === "void") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Query the current bet state.
 * @returns {Object|null} Parsed bet or null if no bet
 */
function getCurrentBet() {
  try {
    const raw = invoke("get_current_bet", [], true);
    if (!raw || raw === "null" || raw === "void") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Commit a new round.
 * @param {string} cranker - Stellar address
 * @param {string} commitHex - 64 hex chars (32 bytes)
 * @param {string|number} bond - Bond amount in stroops
 */
function commitRound(cranker, commitHex, bond) {
  return invoke("commit_round", [
    "--cranker",
    cranker,
    "--commit",
    commitHex,
    "--bond",
    bond.toString(),
  ]);
}

/**
 * Reveal seed and settle the round.
 * @param {string} cranker - Stellar address
 * @param {string} seedCrankerHex - 64 hex chars (32 bytes)
 * @param {string} proofHex - 768 hex chars (384 bytes)
 */
function revealAndSettle(cranker, seedCrankerHex, proofHex) {
  return invoke("reveal_and_settle", [
    "--cranker",
    cranker,
    "--seed_cranker",
    seedCrankerHex,
    "--proof",
    proofHex,
  ]);
}

/**
 * Get the cranker's Stellar address from identity name.
 * @param {string} source - Identity name (e.g., "default")
 * @returns {string} Stellar public key
 */
function getCrankerAddress(source) {
  try {
    return execFileSync("stellar", ["keys", "address", source], {
      encoding: "utf-8",
      timeout: 10_000,
    }).trim();
  } catch (err) {
    throw new Error(`Failed to get address for identity "${source}": ${err.message}`);
  }
}

module.exports = {
  configure,
  invoke,
  getCurrentRound,
  getCurrentBet,
  commitRound,
  revealAndSettle,
  getCrankerAddress,
};
