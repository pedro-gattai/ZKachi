# circuits/roulette — Circom ZK Circuit

## What is this

A Groth16 zero-knowledge circuit (Circom 2) that proves the roulette result is computed fairly without revealing the cranker's salt.

## What the circuit proves

1. **Commit validity:** `commit == Poseidon(seed_cranker, salt)` — cranker knew the seed before the bet
2. **Result range:** `0 <= resultado <= 36`
3. **Deterministic result:** `resultado == (seed_cranker + seed_player) % 37`

Public inputs: `commit`, `seed_cranker`, `seed_player`, `resultado`
Private input: `salt` (never revealed on-chain)

## Pipeline

```bash
# Full pipeline (or run individually):
make circuit

# Individual steps:
make circuit-compile   # Compile .circom → R1CS + WASM
make circuit-setup     # Groth16 trusted setup → proving/verification keys
make circuit-prove     # Generate proof from input.json
```

Or run scripts directly:

```bash
cd circuits/roulette
bash scripts/compile.sh   # Outputs: build/roulette.r1cs, build/roulette_js/
bash scripts/setup.sh     # Outputs: build/roulette_final.zkey, build/verification_key.json
bash scripts/prove.sh     # Outputs: build/proof.json, build/public.json
```

## Dependencies

- **circom** (v2+): Circuit compiler — install from https://docs.circom.io
- **snarkjs**: Proof generation and verification — `npm install -g snarkjs`
- **circomlib**: Standard circuit library (Poseidon, comparators) — auto-installed by `compile.sh` via `npm install`
- **Node.js**: Required by snarkjs and witness generation

## Input format

Edit `input.json` to test with different values:

```json
{
  "commit": "0",           // Poseidon(seed_cranker, salt) — must match
  "seed_cranker": "42",
  "seed_player": "13",
  "resultado": "18",       // (42 + 13) % 37 = 18
  "salt": "12345"
}
```

## Output for Soroban

The proof must be converted to a raw byte blob (384 bytes) for on-chain verification:

- Proof points (a, b, c): 256 bytes
- Public inputs (4 × 32 bytes): 128 bytes

snarkjs outputs JSON — conversion to raw bytes is needed before calling the verifier contract.

## Build artifacts

All outputs go to `build/`:

```
build/
  roulette.r1cs           # Constraint system
  roulette_js/            # WASM witness generator
  roulette.sym            # Symbol file (debugging)
  pot12_final.ptau        # Powers of Tau (trusted setup)
  roulette_final.zkey     # Proving key
  verification_key.json   # Verification key (goes into verifier contract)
  proof.json              # Generated proof
  public.json             # Public inputs
```

## Pitfalls

- `input.json` values must be consistent: `resultado` must equal `(seed_cranker + seed_player) % 37`
- The `commit` value must equal `Poseidon(seed_cranker, salt)` — compute off-chain first
- Trusted setup is deterministic only if same entropy — new setup = new verification keys = must update `contracts/verifier/src/circuit.rs`
- The quotient range check prevents overflow attacks on the modular arithmetic
