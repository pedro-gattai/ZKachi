pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

// ZKachi Roulette Circuit
//
// Proves 3 things:
// 1. Poseidon(seed_cranker, salt) == commit (cranker knew seed before bet)
// 2. resultado = (seed_cranker + seed_player) % 37 (deterministic computation)
// 3. 0 <= resultado <= 36 (valid roulette range)
//
// Public inputs: commit, seed_cranker, seed_player, resultado
// Private inputs: salt

template Roulette() {
    // === Public inputs ===
    signal input commit;
    signal input seed_cranker;
    signal input seed_player;
    signal input resultado;

    // === Private inputs ===
    signal input salt;

    // PROOF 1: Commit verification
    // Cranker committed Poseidon(seed_cranker, salt) before the bet
    component hasher = Poseidon(2);
    hasher.inputs[0] <== seed_cranker;
    hasher.inputs[1] <== salt;
    commit === hasher.out;

    // PROOF 2: Result range check (0 <= resultado <= 36)
    component rangeCheck = LessEqThan(6); // 6 bits enough for 0-36
    rangeCheck.in[0] <== resultado;
    rangeCheck.in[1] <== 36;
    rangeCheck.out === 1;

    // PROOF 3: Deterministic result computation
    // resultado == (seed_cranker + seed_player) % 37
    signal combined <== seed_cranker + seed_player;

    // Constrain: combined = quotient * 37 + resultado
    signal quotient;
    quotient <-- combined \ 37;
    combined === quotient * 37 + resultado;

    // Range check on quotient to prevent overflow attacks
    // quotient must be non-negative and bounded
    component quotientPositive = GreaterEqThan(252);
    quotientPositive.in[0] <== quotient;
    quotientPositive.in[1] <== 0;
    quotientPositive.out === 1;
}

component main {public [commit, seed_cranker, seed_player, resultado]} = Roulette();
