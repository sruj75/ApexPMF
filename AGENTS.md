# Agent Instructions

zeroone is a voice-first customer discovery practice product where a Learner interviews fresh LLM-generated Customer Personas and receives post-session feedback.

## Core Docs

- `PRD.md`: product source of truth.
- `CONTEXT.md`: required domain language for issues, code, tests, and docs.
- `ARCHITECTURE.md`: architecture contract and runtime boundaries.
- `SOFTWARE.md`: module ownership and complexity doctrine.
- `DESIGN.md`: UI style and visual direction.
- `docs/adr/`: durable architecture and software decisions.

## Working Rules

- Keep v1 simple: one modular Next.js app, 100% TypeScript, Effect at meaningful boundaries, Supabase behind repositories, and voice runtime/provider details behind domain boundaries.
- Parse data shapes at boundaries (parse, don't validate): convert external/loose input into typed domain values at the edge and carry refined types inward; do not leave boundary checks as scattered boolean validations.
- Use Effect by default for workflow orchestration, typed failures, retries, resource lifecycles, and boundary integrations; avoid custom Promise-first control flow for domain/application logic unless the code is a tiny local helper.
- Keep UI thin. Do not leak prompts, provider events, Supabase rows, hidden test-plan details, or progression rules into `app/*` surfaces.
- Before changing product behavior, check relevant ADRs and either follow them or explicitly call out the contradiction.

## Commands

- `npm run dev`: start local app.
- `npm run test`: run test suite.
- `npm run build`: run production build.
- `npm run lint`: run lint checks.

## Agent Docs Map

- `docs/agents/domain.md`: how to consume repo domain docs before coding or planning.
- `docs/agents/issue-tracker.md`: GitHub issue workflow for this repo.
- `docs/agents/triage-labels.md`: canonical triage label mapping used by skills.
