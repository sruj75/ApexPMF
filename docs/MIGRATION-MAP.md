# Migration map (legacy → target)

Agent playbook for where code lives today vs where new work should go. **Authoritative contract:** [ARCHITECTURE.md](../ARCHITECTURE.md). **Module doctrine:** [SOFTWARE.md](../SOFTWARE.md).

## Rule of thumb

- **New features:** implement under the **target** layout (`src/platform`, `src/journey`, `src/nodes`, `src/providers`, project-scoped `app/projects/...`).
- **Legacy paths:** bugfixes only in unmigrated flows; do not extend legacy patterns.
- Before editing, read [ARCHITECTURE.md](../ARCHITECTURE.md) and relevant [docs/adr/](adr/).

## App routes

| Legacy (do not extend) | Target (new work) |
|------------------------|-------------------|
| `app/practice/*` | `app/projects/[projectSlug]/nodes/interview-practice/*` |
| `app/dashboard/*` | `app/projects/[projectSlug]/pitwall/*`, `app/projects/[projectSlug]/grid/*` |
| `app/profile/*` | Project-scoped settings / node profile surfaces |
| — | `app/onboarding/tour/*` (first-run tour) |
| — | `app/settings/*` (account: Founder API Key) |
| `app/auth/*`, `app/login`, `app/signup` | Delegate to `platform/shell/service` (target) |

## Source paths

| Legacy | Target |
|--------|--------|
| `src/application/start-session`, `end-session`, `generate-report`, `practice-route` | `src/nodes/interview-practice/service` |
| `src/application/*` (other) | `src/platform/shell/service` or node service |
| `src/domain/persona`, `src/domain/session`, `src/domain/evaluation`, `src/domain/report`, `src/domain/progression` | `src/nodes/interview-practice/{types,config,repo,service,runtime}` |
| `src/domain/credits` | **Delete** (Credits removed from product) |
| `src/infrastructure/supabase/*` | `src/providers/supabase` + slice `repo/` |
| `src/infrastructure/gemini/*` | `src/providers/gemini` |
| `src/infrastructure/llm/openrouter.ts` | **Delete** |
| `src/infrastructure/*` (remainder) | `src/providers/*` |

## Where to put new code

1. **`app/*`** — UI only; call **`platform/shell/service`** or **`nodes/*/service`** facades. No `effect`, no `throw`, no direct `src/domain` or `src/infrastructure` imports (see `tests/app-boundary-imports.test.ts`).
2. **Inside each slice** — layers only: **Types → Config → Repo → Service → Runtime** (forward-only).
3. **Cross-cutting SDKs** — only under `src/providers/` (Gemini, Supabase, workspace FS).

## Tests to respect

- `tests/app-boundary-imports.test.ts` — `app/*` import rules
- `npm run architecture:check` — dependency-cruiser slice boundaries (`.dependency-cruiser.cjs`)
- `tests/supabase-hardening-migration.test.ts`, `tests/platform-foundation-migration.test.ts` — SQL/migration assertions
- Run `npm run test:unit` (fast), `npm run test:coverage` (full), and `npm run architecture:check` before opening a PR

## Related links

- [ARCHITECTURE.md](../ARCHITECTURE.md) — codemap, invariants, slice matrix
- [docs/adr/](../adr/) — decisions (Effect, Schema, thin UI, etc.)
- [docs/vision/architecture-platform-and-nodes.md](vision/architecture-platform-and-nodes.md) — narrative platform vision
