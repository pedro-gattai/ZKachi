import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc } from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// --- Config ---

export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export const SOROBAN_RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC ?? "https://soroban-testnet.stellar.org";

export const ROULETTE_ID = import.meta.env.VITE_ROULETTE_ID as string;
export const POOL_ID = import.meta.env.VITE_POOL_ID as string;
export const HUB_ID = import.meta.env.VITE_HUB_ID as string;
export const VERIFIER_ID = import.meta.env.VITE_VERIFIER_ID as string;
export const XLM_TOKEN = import.meta.env.VITE_XLM_TOKEN as string;

// Stroops per XLM
export const STROOPS = 10_000_000n;

// --- Server & Contract ---

let _server: rpc.Server | null = null;

export function getServer(): rpc.Server {
  if (!_server) {
    _server = new rpc.Server(SOROBAN_RPC_URL);
  }
  return _server;
}

export function getContract(contractId: string): StellarSdk.Contract {
  return new StellarSdk.Contract(contractId);
}

// --- Transaction helpers ---

export async function buildTx(
  publicKey: string,
  ...operations: StellarSdk.xdr.Operation[]
): Promise<StellarSdk.Transaction> {
  const server = getServer();
  const account = await server.getAccount(publicKey);
  const builder = new StellarSdk.TransactionBuilder(account, {
    fee: "1000000", // 0.1 XLM max fee — generous for testnet
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  for (const op of operations) {
    builder.addOperation(op);
  }
  builder.setTimeout(60);
  return builder.build();
}

/**
 * Simulate, sign via Freighter, and submit a transaction.
 * Returns the result value from the invocation.
 */
export async function prepareAndSubmit(
  tx: StellarSdk.Transaction,
  publicKey: string,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const server = getServer();

  // Simulate to get the prepared (assembled) transaction
  const simulated = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const prepared = rpc.assembleTransaction(tx, simulated).build();

  // Sign via Freighter
  const signResult = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  if (signResult.error) {
    throw new Error(`Signing failed: ${signResult.error}`);
  }

  const signed = StellarSdk.TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    NETWORK_PASSPHRASE,
  ) as StellarSdk.Transaction;

  // Submit
  const sendResult = await server.sendTransaction(signed);
  if (sendResult.status === "ERROR") {
    throw new Error(`Submit failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  // Poll for result
  return await pollTx(sendResult.hash);
}

async function pollTx(
  hash: string,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const server = getServer();
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    const result = await server.getTransaction(hash);
    if (result.status === "SUCCESS") {
      return result as rpc.Api.GetSuccessfulTransactionResponse;
    }
    if (result.status === "FAILED") {
      throw new Error("Transaction failed on-chain");
    }
    // NOT_FOUND — still pending
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Transaction polling timed out");
}

// --- Read-only contract call (no signing) ---

export async function callReadOnly(
  contractId: string,
  method: string,
  ...args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | undefined> {
  const server = getServer();
  const contract = getContract(contractId);
  const op = contract.call(method, ...args);

  // Use a dummy source for read-only simulation
  const account = new StellarSdk.Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }
  if (!rpc.Api.isSimulationSuccess(sim)) {
    return undefined;
  }
  const resultEntry = sim.result;
  return resultEntry?.retval;
}

// --- ScVal conversion helpers ---

export function scValToNative(val: StellarSdk.xdr.ScVal): any {
  return StellarSdk.scValToNative(val);
}

export function addressToScVal(address: string): StellarSdk.xdr.ScVal {
  return new StellarSdk.Address(address).toScVal();
}

export function i128ToScVal(value: bigint): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "i128" });
}

export function u32ToScVal(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.xdr.ScVal.scvU32(value);
}

export function u64ToScVal(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "u64" });
}

export function bytesN32ToScVal(bytes: Uint8Array): StellarSdk.xdr.ScVal {
  return StellarSdk.xdr.ScVal.scvBytes(Buffer.from(bytes));
}

import type { BetType } from "@/components/app/roulette/constants";

/**
 * Convert frontend BetType to Soroban ScVal enum.
 * Soroban enums are encoded as ScVal::Vec([ScVal::Symbol(variant), ...args])
 */
export function betTypeToScVal(bet: BetType): StellarSdk.xdr.ScVal {
  const { xdr } = StellarSdk;
  switch (bet.kind) {
    case "straight":
      return xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol("Straight"),
        xdr.ScVal.scvU32(bet.number),
      ]);
    case "dozen":
      return xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol("Dozen"),
        xdr.ScVal.scvU32(bet.group),
      ]);
    case "color":
      return xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol(bet.color === "red" ? "Red" : "Black"),
      ]);
    case "parity":
      return xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol(bet.parity === "even" ? "Even" : "Odd"),
      ]);
    case "half":
      return xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol(bet.half === "1-18" ? "Low" : "High"),
      ]);
  }
}

/**
 * Parse Round from contract ScVal.
 * Returns null if val is void/none.
 */
export interface ContractRound {
  id: number;
  cranker: string;
  commit: string;
  bond: bigint;
  status: "Open" | "BetPlaced" | "Settled" | "TimedOut";
  commit_ledger: number;
  result: number;
}

export function parseRound(val: StellarSdk.xdr.ScVal | undefined): ContractRound | null {
  if (!val || val.switch().name === "scvVoid") return null;
  const native = scValToNative(val);
  if (!native) return null;
  return {
    id: Number(native.id),
    cranker: native.cranker,
    commit: native.commit ? Buffer.from(native.commit).toString("hex") : "",
    bond: BigInt(native.bond),
    status: parseStatus(native.status),
    commit_ledger: Number(native.commit_ledger),
    result: Number(native.result),
  };
}

function parseStatus(status: any): ContractRound["status"] {
  if (typeof status === "string") return status as ContractRound["status"];
  if (Array.isArray(status)) return status[0] as ContractRound["status"];
  return "Open";
}

export interface ContractBet {
  player: string;
  bet_type: string;
  amount: bigint;
  seed_player: string;
}

export function parseBet(val: StellarSdk.xdr.ScVal | undefined): ContractBet | null {
  if (!val || val.switch().name === "scvVoid") return null;
  const native = scValToNative(val);
  if (!native) return null;
  return {
    player: native.player,
    bet_type: JSON.stringify(native.bet_type),
    amount: BigInt(native.amount),
    seed_player: native.seed_player ? Buffer.from(native.seed_player).toString("hex") : "",
  };
}

/** Convert stroops (i128) to XLM number for display */
export function stroopsToXlm(stroops: bigint): number {
  return Number(stroops) / 10_000_000;
}

/** Convert XLM number to stroops bigint */
export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10_000_000));
}

/** Get latest ledger sequence from Soroban RPC */
export async function getLatestLedger(): Promise<number> {
  const server = getServer();
  const res = await server.getLatestLedger();
  return res.sequence;
}

/** Generate 32 random bytes for seed_player */
export function randomSeed(): Uint8Array {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytes;
}

const STELLAR_EXPERT_BASE = "https://stellar.expert/explorer/testnet";

export function stellarExpertUrl(type: "account" | "contract" | "tx", id: string): string {
  return `${STELLAR_EXPERT_BASE}/${type}/${id}`;
}
