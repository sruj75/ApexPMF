# Agent Instructions

ApexPMF is a voice-first customer discovery practice product where a Learner interviews fresh LLM-generated Customer Personas and receives post-session feedback.

## Essentials

- **Stack:** one modular Next.js app, TypeScript, Effect at meaningful boundaries, Supabase behind repositories; voice/provider details stay behind domain boundaries.
- **Package manager:** npm (`packageManager`: npm@11.13.0). **Node:** `>=24.11.0` (see `package.json` engines).

## Commands

- `npm run dev` — start local app
- `npm run test` — all Vitest projects (`npm run test:watch` for watch mode)
- `npm run test:unit` — Node unit tests (CI fast job)
- `npm run test:ui` — jsdom RTL tests
- `npm run test:coverage` — Vitest with coverage thresholds (CI full job)
- `npm run test:e2e` — Playwright public smoke (see `docs/agents/e2e.md`)
- `npm run architecture:check` — dependency-cruiser boundaries (CI fast job)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

## Working rules

- Parse at boundaries (parse, don't validate): convert loose external input into typed domain values at the edge; don't scatter boolean validations inward.
- Use Effect for workflow orchestration, typed failures, retries, resource lifecycles, and boundary integrations; avoid Promise-first domain/application control flow except tiny local helpers.
- Keep UI thin: don't leak prompts, provider events, Supabase rows, hidden test-plan details, or progression rules into `app/*`.
- Before changing product behavior, read relevant `docs/adr/` entries and either follow them or call out the contradiction.

## Read more

- `CONTEXT.md` — domain language (required for issues, code, tests, docs)
- `PRD.md` — product source of truth
- `ARCHITECTURE.md` — system shape, runtime boundaries, codemap
- `SOFTWARE.md` — module ownership and implementation doctrine
- `DESIGN.md` — UI style and visual direction
- `docs/adr/` — durable architecture and software decisions
- `docs/agents/domain.md` — how to consume domain docs before coding or planning
- `docs/agents/issue-tracker.md` — GitHub issue workflow (`gh` CLI)
- `docs/agents/triage-labels.md` — canonical triage label mapping for skills
- `docs/agents/e2e.md` — Playwright smoke and local authenticated journey
