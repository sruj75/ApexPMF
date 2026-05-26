# ApexPMF

Voice-first customer discovery practice: a **Learner** interviews LLM-generated **Customer Personas** and receives post-session feedback. The product is evolving into a founder workspace (Pitwall, Grid, Journey Brain) with interview practice as the first **Node**. See [PRD.md](PRD.md) for direction.

## Prerequisites

- **Node.js** 24.11.0 or newer (`engines` in [package.json](package.json))
- **npm** 11+ (see `packageManager` in [package.json](package.json))

## Setup

```bash
git clone https://github.com/sruj75/ApexPMF.git
cd ApexPMF
npm install
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase and app secrets (see below).

## Environment variables

Copy [.env.local.example](.env.local.example) to `.env.local`. Required for local dev:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `FOUNDER_API_KEY_CIPHER_SECRET` | Encrypts Founder API keys at rest (min 16 characters) |

**Legacy (migration in progress):** OpenRouter variables in the example file support unmigrated code paths. Target stack is BYOK **Gemini only**; see [ARCHITECTURE.md](ARCHITECTURE.md).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run test` | Run all Vitest projects (unit + ui) |
| `npm run test:unit` | Node-only unit tests (CI fast job) |
| `npm run test:ui` | jsdom component tests |
| `npm run test:coverage` | Vitest with coverage thresholds |
| `npm run test:e2e` | Playwright public smoke (requires `npm run build` first) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run architecture:check` | dependency-cruiser slice boundaries |
| `npm run build` | Production build |

## Documentation

| Doc | Use |
|-----|-----|
| [AGENTS.md](AGENTS.md) | Agent entry: commands, rules, doc map |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layout, boundaries, invariants |
| [CONTEXT.md](CONTEXT.md) | Domain language |
| [docs/MIGRATION-MAP.md](docs/MIGRATION-MAP.md) | Legacy → target paths during migration |
| [docs/adr/](docs/adr/) | Architecture decisions |

## CI

Pull requests and pushes to `main` run three jobs (see [.github/workflows/ci.yml](.github/workflows/ci.yml)):

1. **fast** — lint → typecheck → `test:unit` → `architecture:check` (target under ~2 minutes)
2. **full** — `test:coverage` → build
3. **e2e** — Playwright public smoke against production server

Authenticated browser flows are documented in [docs/agents/e2e.md](docs/agents/e2e.md) (local/staging only; not in CI).
