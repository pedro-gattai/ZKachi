# frontend — Web Frontend

## What is this

React/Vite web frontend for the ZKachi roulette game. Provides the player-facing UI for betting, LP management, and ZK proof verification. **Integrated with Soroban testnet contracts** via `@stellar/stellar-sdk` + Freighter wallet.

## Stack

- **Framework:** React 18, TypeScript, Vite 5
- **Styling:** Tailwind CSS 3, shadcn/ui (Radix UI primitives), Framer Motion
- **Routing:** React Router v6
- **Data:** TanStack React Query v5
- **Blockchain:** `@stellar/stellar-sdk` (Soroban RPC), `@stellar/freighter-api` (wallet signing)
- **Forms:** react-hook-form + zod
- **Testing:** Vitest + React Testing Library + jsdom

## Structure

```
src/
  pages/            — Route components
    Index.tsx         Landing page (hero + animated wheel)
    GamePage.tsx      Roulette game — polls contract for round state, places bets via Freighter
    PoolPage.tsx      LP dashboard — deposit/withdraw via contract calls
    VerifyPage.tsx    Proof explorer — shows current round + hub stats from contracts
    DocsPage.tsx      Documentation — how to play, bet types, pool, ZK verification, contracts
    NotFound.tsx      404
  components/
    ui/             — shadcn/ui primitives (generated — edit with care)
    app/            — App-specific components
      AppLayout.tsx   /app wrapper with top nav bar
      roulette/       Game components (BettingBoard, BetControls, GameStatusPanel, constants)
    Navbar.tsx        Landing page nav
    Footer.tsx        Footer
    RouletteWheel.tsx Animated 3D wheel
    HeroMessage.tsx   Landing hero section
    TrustSection.tsx  Verification features section
    LiquiditySection.tsx  LP incentives section
  hooks/            — React Query hooks for contract interaction
    use-roulette.ts   Roulette contract: useCurrentRound, useCurrentBet, usePlaceBet
    use-pool.ts       Pool contract: usePoolBalance, useTotalShares, useDeposit, useWithdraw, etc.
    use-hub.ts        Hub contract: useTotalSessions, useSession
    use-wallet.ts     Re-export of WalletContext hook
    use-mobile.ts     Responsive breakpoint hook
    use-toast.ts      Toast notification hook
  lib/
    soroban.ts        Soroban SDK config, helpers, tx builder, ScVal converters
    utils.ts          cn helper
  contexts/
    WalletContext.tsx  Freighter wallet connection + signTransaction
  test/             — Vitest setup + example test
  App.tsx           — Router + providers (QueryClient, WalletProvider, Toaster, TooltipProvider)
  main.tsx          — React DOM entry point
```

## Contract Integration Architecture

### Config
- Contract IDs and RPC URL are configured via `.env` file (Vite env vars `VITE_*`)
- `src/lib/soroban.ts` centralizes SDK setup: server instance, contract helpers, tx building, ScVal conversion

### Read-only queries
- Use `callReadOnly()` which simulates a transaction with a dummy account (no signing needed)
- React Query polls at intervals (3s for game state, 10s for pool/hub)

### Mutations (write transactions)
- Build tx → simulate → assemble → sign via Freighter → submit → poll for result
- `prepareAndSubmit()` in `soroban.ts` handles the full flow

### Game state derivation
- `GamePage` derives `GamePhase` from `round.status`: null→WAITING, Open→OPEN, BetPlaced→REVEALING, Settled→SETTLED
- `PoolPage` reads pool balance, shares, share price directly from contract
- `VerifyPage` shows current round data + hub session stats

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Index | Landing page |
| `/app/game` | GamePage | Roulette game (real contract integration) |
| `/app/pool` | PoolPage | LP deposit/withdraw (real contract integration) |
| `/app/verify` | VerifyPage | Proof explorer (current round + hub stats) |
| `/app/docs` | DocsPage | Documentation (how to play, ZK verification, contracts) |

`/app` uses `AppLayout` as a wrapper with navigation tabs.

## Commands

```bash
npm run dev        # Dev server on port 8080
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest (run once)
npm run test:watch # Vitest (watch mode)
```

## Conventions

- **Path alias:** `@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)
- **shadcn imports:** `import { Button } from "@/components/ui/button"`
- **Custom theme:** Colors in `tailwind.config.ts` under `zkachi` namespace (bg, surface, border, purple, gold, etc.)
- **Fonts:** `font-outfit` (headings), `font-space` (mono labels/amounts), `font-dm-sans` (body)
- **Animations:** Framer Motion for page transitions and loading states
- **Amounts:** All contract values are in stroops (1 XLM = 10,000,000 stroops). Use `stroopsToXlm()` / `xlmToStroops()` for display ↔ contract conversion.

## Environment variables

```
VITE_ROULETTE_ID    — Roulette contract address
VITE_POOL_ID        — Pool contract address
VITE_HUB_ID         — Hub contract address
VITE_VERIFIER_ID    — Verifier contract address
VITE_XLM_TOKEN      — XLM SAC token address
VITE_SOROBAN_RPC    — Soroban RPC URL (default: https://soroban-testnet.stellar.org)
VITE_NETWORK_PASSPHRASE — Network passphrase (default: Test SDF Network ; September 2015)
```

## Pitfalls

- Components in `components/ui/` are generated by shadcn CLI — edit them carefully, prefer overriding via props/className
- TypeScript strict mode is disabled (`noImplicitAny: false`, `strictNullChecks: false`)
- HMR error overlay is disabled in vite.config.ts
- Game bet evaluation logic lives in `components/app/roulette/constants.ts`, not in a page file
- `vite-plugin-node-polyfills` is required for Buffer support (used by stellar-sdk)
- Soroban enums (BetType) are serialized as `ScVal::Vec([Symbol(variant), ...args])` — see `betTypeToScVal()` in soroban.ts
- `getSACBalance` is used for XLM balance (not `getAccount().balances` which is Horizon-only)
- The cranker bot must be running for game rounds to work end-to-end
