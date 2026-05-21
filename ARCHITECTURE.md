# Architecture

Architecture contract for this repository. Align with `CONTEXT.md`, `SOFTWARE.md`, `docs/vision/architecture-platform-and-nodes.md`, `docs/vision/product-vision-grill-synthesis.md`, and `docs/adr/`. Narrative product detail lives in vision docs; this file is the **map and enforceable rules** for agents and humans.

**Status:** Code is mid-migration. **Target** layout and boundaries below are authoritative for new work. **Legacy** paths (`src/domain/*`, `src/application/*`, `src/infrastructure/*`, `app/practice/*`) remain until cutover; do not extend legacy patterns.

## Bird's-eye Overview

**ApexPMF** is a modular-monolith Next.js app: a **Founder** uses **Command** (operational intelligence) and **Grid** (PMF **Node** map). Each **Node** is a Codex-style **plugin** with its own **Node Runtime**, **Node Skill**, and **Node Workspace**. One **Journey Brain** (Deep Agents, TypeScript-first via `deepagentsjs`) spans all **Nodes**; it is **not** the in-session authority inside specialist **Node** UX (interview voice loop in v1).

**V1 product spine:** real **Command** + **Grid** with **one Node** (customer interview / Mom Test voice **Session** practice), fully interactive **Active Node surface**, new shell routes (`app/command`, `app/grid`, `app/nodes/interview/*`). No legacy top-level dashboard/practice routes for that slice.

**Data:** **Platform store** (Postgres/Supabase) is UI source of truth; **Node Workspace** (virtual FS per **Node**) holds consolidated agent-readable artifacts. **Node Runtime** syncs DB → **Node Workspace** after milestones; **Journey Brain** reads workspaces, not raw dumps every turn.

**Providers:** BYOK **Founder API Key**; **Gemini only** for voice and non-live LLM. **No** OpenRouter, subscription billing, or Credits in the target system.

**Runtime:** Effect at service/runtime/provider boundaries for typed failures, retries, and composition. `app/*` stays Promise-only via thin `Effect.runPromise` facades in `*/service/*`.

```text
Founder → Command (brain output) | Grid (topology) | Active Node (Node Runtime work)
                              ↘ Journey Brain (spine) ↗
                                    Node Workspaces + Platform store
```

## Codemap

### Target (authoritative for new code)

```text
app/
  command/*              # Command module UI (= Dashboard / Mission Control)
  grid/*                 # Grid module UI (= Playground)
  nodes/interview/*      # Interview Node Active Node surface + actions
  auth/*                 # Auth entry (must delegate to platform/shell/service)
  login, signup
src/
  providers/             # ONLY cross-cutting implementations
    gemini/              # BYOK Founder Gemini (voice + generate)
    supabase/            # Auth + DB client factories
    workspace/           # Node Workspace virtual FS (Deep Agents backing)
  platform/
    types/               # FounderId, NodeId, shared branded IDs
    registry/            # Prebuilt Node catalog metadata (Grid + brain)
    shell/
      types/
      config/
      repo/
      service/           # Command/Grid facades, auth, BYOK settings, open Node
      runtime/           # Shell-adjacent loops if needed (keep thin)
  journey/
    brain/               # SIBLING of platform/shell — not nested under it
      types/
      config/
      repo/
      service/           # Brain API consumed by platform/shell/service facade
      runtime/           # Deep Agents graph steps, workspace tools
  nodes/
    interview-practice/  # V1 Node plugin (Mom Test simulator)
      types/
      config/
      repo/              # Session, persona, report persistence + decode
      service/           # Start/end session, report, profile, route policy
      runtime/           # Voice session loop, persona gen adapters, evaluation transport
tests/*
docs/adr/*
docs/vision/*
```

**`app/*`:** rendering, navigation, server actions. Imports **only** `platform/shell/service` facades and `nodes/*/service` facades (and re-exported view types from those facades). **Never** `src/providers/*`, `src/journey/brain/*` internals, `effect`, or slice `types/repo/runtime` directly.

**`src/platform/shell/service`:** auth resolution, **Command** page data, **Grid** topology, **Founder API Key** settings, navigation to **Active Node surface**. Calls **`journey/brain/service` facade** for bottleneck / what-next — not Deep Agents types in `app/*`.

**`src/journey/brain`:** meta-agent spine; read/write **Node Workspaces**; pathing hints for **Grid**; synthesis for **Command**. Does **not** own interview voice turns in v1.

**`src/nodes/interview-practice`:** **Node Runtime** for voice **Session**, persona generation, **Hidden Evaluation**, **Session Report**, Ideal Customer Profile, progression inside this **Node**. Consolidation into **Node Workspace** after session milestones.

**`src/providers`:** Gemini BYOK, Supabase, workspace backend. Slices depend on **provider interfaces**, not env keys or raw SDK clients scattered in UI.

### Legacy (migrate away — do not extend)

```text
app/dashboard, app/practice, app/profile
src/application/*          # → nodes/interview-practice/service + platform/shell/service
src/domain/*               # → nodes/interview-practice/{types,repo,service,runtime}
src/infrastructure/*       # → src/providers/*
```

| Legacy module | Target |
|---------------|--------|
| `application/start-session`, `end-session`, `generate-report`, `practice-route` | `nodes/interview-practice/service` |
| `domain/persona`, `domain/session`, `domain/credits` | `nodes/interview-practice/*` (delete credits) |
| `infrastructure/llm/openrouter.ts` | **Delete** |
| `infrastructure/gemini/*` | `providers/gemini` |
| `infrastructure/supabase/*` | `providers/supabase` + node/platform `repo` |

### Horizontal layers (inside each vertical slice)

Every slice under `platform/shell`, `journey/brain`, and `nodes/*` uses the same **forward-only** layer stack. **UI** is **`app/*` only** (not a `ui/` folder inside slices).

```text
Types → Config → Repo → Service → Runtime
  ↑       ↑       ↑        ↑         ↑
 innermost                              outermost (within slice)
```

- **Types:** shapes, branded IDs, error unions (no Supabase rows, no fetch).
- **Config:** env and per-founder settings resolution for this slice.
- **Repo:** persistence; decode at boundary (parse, don't validate).
- **Service:** use cases, policies, `Effect.runPromise` web adapters for `app/*`.
- **Runtime:** long-running or provider-adjacent loops (voice, agent graph step).

## Architectural Invariants

- **One deployable:** single Next.js TypeScript modular monolith; no split services in v1.
- **Vertical slices:** `platform/shell`, `journey/brain` (sibling), `nodes/*` are **deep modules** at product boundaries. **Forbidden:** `nodes/*` importing sibling `nodes/*`; any slice importing another slice's `repo/` or `service/`; **Command** nested inside `journey/brain` or vice versa as parent/child packages.
- **Journey Brain sibling:** `src/journey/brain` is **not** under `src/platform/shell`. **Command** consumes brain output; **Command is not the brain.**
- **Nodes are plugins:** prebuilt catalog; **Node Runtime** owns in-session authority for interview v1; brain observes **Node artifacts** and **Node Workspace** files.
- **Layer direction (mechanical):** within each slice, dependencies flow **Types → Config → Repo → Service → Runtime** only. No layer skips, no reverse edges.
- **Providers only:** cross-cutting integrations (Gemini, Supabase, workspace FS, future telemetry) enter slices **only** through `src/providers/*` interfaces — not direct `process.env`, SDK clients, or `src/infrastructure/*` in slice code.
- **`app/*` thin:** no domain rules, no `effect`, no `throw` in production paths; no imports from `providers`, `journey/brain` internals, or slice layers other than published **service** facades.
- **Parse at boundaries:** external/loose input becomes typed values at repo/provider/runtime edges; no ad-hoc boolean validation chains inward.
- **Gemini-only LLM:** persona generation, hidden evaluation, and brain calls use **FounderGeminiProvider** (BYOK). OpenRouter and Credits are **removed**, not migrated.
- **Platform store vs Node Workspace:** DB holds structured product truth; workspaces hold consolidated agent narrative. **Node Runtime** owns post-milestone sync; interview v1 must not require brain on every voice turn.
- **Effect:** service/runtime/provider workflows use Effect; `Effect.runPromise` lives in `*/service/*` adapters, not in `app/*` route handlers.
- **Reconciliation:** intentional invariant changes update this file and an ADR before code drifts.

## Boundaries

### Slice dependency matrix (target)

| From → To | Allowed |
|-----------|---------|
| `app/*` | `platform/shell/service`, `nodes/*/service` facades only |
| `platform/shell` | own layers, `platform/registry`, `platform/types`, `journey/brain/service` facade, `providers` |
| `journey/brain` | own layers, `providers`, `platform/registry` (topology metadata) — **not** `nodes/*/repo` or `nodes/*/runtime` |
| `nodes/interview-practice` | own layers, `providers` — **not** `journey/brain`, **not** other `nodes/*` |
| `providers` | external packages only — **not** `platform`, `journey`, or `nodes` |

```text
app/*  →  platform/shell/service  →  journey/brain/service  →  providers
              ↓
          nodes/*/service  →  nodes/*/runtime  →  providers
          (does NOT import journey/brain in v1)
```

### Layer edges (within each slice)

- **Runtime → Service → Repo → Config → Types** (import direction: outer may import inner adjacent layer only).
- **Service** is the **only** layer `app/*` may call for that slice.
- **Repo/Runtime** implement ports defined in **Types**; they do not import **Service**.

### Product seams

| Seam | Rule |
|------|------|
| **Command ↔ Journey Brain** | `platform/shell/service` → `journey/brain/service` facade only |
| **Grid ↔ Nodes** | topology from `platform/registry` + node state; open **Active Node surface** via shell navigation |
| **Interview Node ↔ Brain** | artifacts via **Platform store** + **Node Workspace** sync — not live voice coupling |
| **Persona / evaluation ↔ LLM** | prompts/schemas in **service** or **runtime**; transport via **providers/gemini** implementing ports |
| **Auth** | `app/auth/*` → `platform/shell/service` → **providers/supabase** (no direct Supabase client in `app/*`) |

### Data plane

- **Platform store:** Supabase/Postgres — auth, sessions, reports JSON, progression, API key **handles** (not secrets in workspace files).
- **Node Workspace:** per-founder, per-node paths via **WorkspaceProvider**; brain read/search; Node Runtime writes consolidated summaries.

## Cross-cutting Concerns

**Mechanical enforcement (required as target lands):**

- **dependency-cruiser** or ESLint `import/no-restricted-paths` for slice matrix + per-slice layers.
- **`tests/app-boundary-imports.test.ts`:** extend to forbid `app/*` → `src/infrastructure/*` and `src/providers/*` (legacy infra included during migration).
- **`npm run architecture:check`** in CI (layer + slice rules); strict on `src/providers`, `src/platform`, `src/journey`, `src/nodes`; grandfather list for legacy until deleted.
- Optional: vendor `scripts/check_layer_invariants.py` from architecture-md-manager skill with `--layers types,config,repo,service,runtime` and `--provider-dirs providers`.

**Boundary parsing:** Supabase rows, Gemini/LLM JSON, and redirect paths decoded once at repo/provider/runtime edges (Effect Schema where applicable per ADR-0013).

**Error shaping:** service facades map typed failures to stable categories for redirects and UI (no adapter error classes leaking to `app/*`).

**Security:** founder identity server-side via Supabase auth; **Founder API Key** encrypted/stored via platform repo — never logged or passed to client bundles.

**Composition:** one **composition root** per request/workflow builds Effect layers from **Providers** — avoid duplicating env reads and client construction in every server action.

**Observability:** typed errors at boundaries; no provider payload shapes in UI.

**Testing:** behavior through **service** facades and provider contract tests; structural tests for import rules; parse tests for repo/LLM decoders.

**Migration:** stand up `providers/` + `platform/shell` + `journey/brain` + `nodes/interview-practice` beside legacy; cut routes; delete `domain/`, `application/`, `infrastructure/`, OpenRouter, Credits. See `docs/vision/architecture-platform-and-nodes.md` §5.
