# ZKachi — Benchmark de Progresso

## Overall Progress

```
[███████████████████████░] ~95%
```

Smart contracts prontos e testados (30/30). ZK pipeline executado com sucesso. VK reais exportados para o verifier. Proof converter e play-round.sh completos e corrigidos. Cranker bot implementado. README para hackathon pronto. Falta: frontend integration, E2E testnet.

---

## Component Status

| Componente | Status | Notas |
|---|---|---|
| Pool contract | ✅ Done | Código completo + 8 testes passando |
| Roulette contract | ✅ Done | Game flow completo (commit→bet→reveal→settle) + 5 testes |
| Common library | ✅ Done | Types, constants, zk.rs (Groth16 verifier logic) |
| Verifier contract | ✅ Done | VK reais do trusted setup exportados para circuit.rs |
| Circom circuit | ✅ Done | Compilado, setup executado, proof gerado e verificado |
| Deploy scripts | ✅ Done | deploy.sh, init.sh, seed-pool.sh prontos |
| play-round.sh | ✅ Done | Commit → bet → reveal com proof real |
| Proof converter | ✅ Done | scripts/proof-to-bytes.js — JSON → 384 bytes hex |
| Frontend | 🔄 Em progresso | Sendo construído no Lovable, será integrado depois |
| Cranker bot | ✅ Done | State machine: IDLE → COMMITTED → REVEAL, Poseidon + snarkjs |
| Testes | ✅ Done | 30/30 passando (8 pool + 21 roulette + 1 verifier) |
| Documentação | ✅ Done | plan.md + CLAUDE.md + README.md para hackathon |

---

## Critical Path

Blockers em ordem de dependência — cada item desbloqueia o próximo:

1. **`make circuit-compile` + `make circuit-setup`** → gera `verification_key.json` e `proving_key`
2. **Exportar VK reais** para `contracts/verifier/src/circuit.rs` (substituir zeros atuais)
3. **Criar converter** proof JSON (snarkjs output) → 384 bytes raw (formato Soroban)
4. **Completar `play-round.sh`** com `reveal_and_settle` usando proof real
5. **Integrar frontend** do Lovable ao repo

---

## Detailed Checklist

### Smart Contracts

- [x] Pool contract — deposit, withdraw, payout, absorb, share accounting
- [x] Pool tests — 8 testes cobrindo deposit, withdraw, payout, absorb, edge cases
- [x] Roulette contract — commit_round, place_bet, reveal_and_settle, claim_timeout
- [x] Roulette tests — 5 testes cobrindo game flow, timeout, invalid bets
- [x] Common library — BetType, Round, StoredBet, VerificationKeys, constants
- [x] Common zk.rs — Groth16 verification logic (G1/G2 ops, pairing check)
- [x] Verifier contract — verify() entry point, VK storage
- [x] Verifier VK — VK reais exportados do trusted setup para circuit.rs

### ZK Circuit

- [x] Circom code — `roulette.circom` com lógica correta (hash, mod 37)
- [x] Circuit compile — `circom roulette.circom --r1cs --wasm` (503 constraints)
- [x] Trusted setup — `snarkjs groth16 setup` (phase 1 + phase 2, BN128 2^14)
- [x] Generate proof — `snarkjs groth16 prove` com Poseidon hash real, verificação local OK
- [x] Export VK — pontos G1/G2 convertidos para bytes big-endian em circuit.rs

### Integration

- [x] Proof converter script — `scripts/proof-to-bytes.js` gera 384 bytes (768 hex chars)
- [x] play-round.sh E2E — commit → bet → reveal com proof real
- [x] input.json com valores reais — Poseidon(42, 12345) = commit correto, resultado=18
- [ ] Teste E2E em testnet — round completo com settlement (requer stellar CLI + testnet)

### Frontend

- [ ] App básico no Lovable (em progresso separado)
- [ ] Integrar ao repo ZKachi
- [ ] Conectar com Freighter wallet
- [ ] Chamar contratos via Stellar SDK

### Operations

- [x] deploy.sh — deploy dos 3 contratos
- [x] init.sh — inicializa cross-references entre contratos
- [x] seed-pool.sh — adiciona liquidez inicial
- [x] Cranker bot — serviço que faz commit → reveal automaticamente
- [ ] Monitoring — health check dos contratos

### Documentation & Tests

- [x] plan.md — plano geral do projeto
- [x] CLAUDE.md — instruções por crate (7 arquivos)
- [x] 30/30 testes passando (8 pool + 21 roulette + 1 verifier)
- [x] README público — explicação para jurados do hackathon
- [ ] Demo script/video — walkthrough do fluxo

---

## Next Steps (Priorizado)

1. ~~Compilar o circuito~~ ✅
2. ~~Rodar trusted setup~~ ✅
3. ~~Exportar VK para o contrato~~ ✅
4. ~~Criar script converter~~ ✅
5. ~~Completar play-round.sh~~ ✅
6. **Teste E2E em testnet** — instalar `stellar` CLI, deploy, rodar round completo
7. ~~Cranker bot~~ ✅
8. **Integrar frontend** — quando Lovable estiver pronto
9. ~~README para hackathon~~ ✅
