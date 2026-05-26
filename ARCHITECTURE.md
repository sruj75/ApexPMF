# Architecture

Architecture contract for this repository. Align with `CONTEXT.md`, `SOFTWARE.md`, `docs/vision/architecture-platform-and-nodes.md`, `docs/vision/product-vision-grill-synthesis.md`, and `docs/adr/`. Narrative product detail (feature tour copy, onboarding screenshots) lives in `docs/vision/`; this file is the **map and enforceable rules** for agents and humans.

**Status:** Code is mid-migration. **Target** layout and boundaries below are authoritative for new work. **Legacy** paths (`src/domain/*`, `src/application/*`, `src/infrastructure/*`, `app/practice/*`) remain until cutover; do not extend legacy patterns.

## Bird's-eye Overview

**ApexPMF** is a modular-monolith Next.js app. A **Founder account** (auth identity) may own multiple **Projects** (one startup idea each toward PMF). The product **shell** — **Pitwall**, **Grid**, **Agent chat rail**, **Journey Brain**, **Node Workspaces**, and **Sessions** — runs inside exactly one **active Project** at a time, switched via a Vercel-style **Project switcher** on the **Pitwall** top bar.

Each **Node** on the **Grid** is a Codex-style **plugin** (**Node Runtime**, **Node Skill**, **Node Workspace**). **Journey Brain** (Deep Agents, TypeScript-first via `deepagentsjs`) spans the **active Project** only; it is **not** the in-session authority inside specialist **Node** UX (interview voice loop in v1).

**First-run path:** sign up → **feature tour** (**Back** / **Next** only; **second-to-last** = **Founder API Key** form; **last** = startup name + create **Project**) → `/projects/[projectSlug]/pitwall` **Pitwall composer state** → **conversational onboarding** (**Founder context**) → **Pitwall operational state** when context sufficient (**before** first **Session** required). Additional **Projects**: switcher inline create → **composer state** + onboarding (no tour, no API key step).

**V1 shell:** real **Pitwall** + **Grid** (sidebar only). **Grid** renders **only** shipped **Nodes** (one **Interview practice**—no skeleton locked placeholders). **Node unlock:** `locked` | `unlocked` per **Node** per **Project**; catalog sets **unlocked at boot** (conversation: pre-journey)—**no** `pre_journey` code category. **Start Practice** during **Pitwall composer state** OK; **Pitwall operational state** only after onboarding chat completes (not after **Session**). Shell routes are **Project-scoped**: `/projects/[projectSlug]/pitwall`, `/projects/[projectSlug]/grid`, `/projects/[projectSlug]/nodes/interview-practice/…`. **Account** chrome: left sidebar **footer** (profile + **account menu** → **Settings**, **Founder API Key**, log out)—Vercel-style; not under `/projects/…`. **Founder API Key** is **account-scoped**. ICP, **Sessions**, **Progression**, interview **Profile Settings** are **Project-scoped**.

**Data:** **Platform store** (Postgres/Supabase) holds **Project** records and **Project**-scoped product rows; **Node Workspace** paths are **per Project, per Node**. **Node Runtime** syncs DB → **Node Workspace** after milestones.

**Providers:** BYOK **Founder API Key**; **Gemini only**. **No** OpenRouter, subscription billing, or Credits.

**Runtime:** Effect at service/runtime/provider boundaries. `app/*` is Promise-only via `*/service/*` facades.

```text
Founder account (auth, Founder API Key)
    │
    ├── Project A ── active ──► Pitwall | Grid | Active Node
    │         └── Journey Brain + Node Workspaces + Platform rows (project_id)
    └── Project B ── (inactive until switched)
```

## Codemap

### Target (authoritative for new code)

```text
app/
  onboarding/tour/*                    # Feature tour (pre-shell; last step creates Project)
  projects/[projectSlug]/
    pitwall/*                          # Pitwall: composer state | operational state; Project switcher (top bar)
    grid/*                             # Grid (= Playground)
    nodes/interview-practice/*           # Interview practice Node only (simulator); not Customer interview (future)
  settings/*                           # Account settings (Founder API Key); account-scoped, not /projects/…
  auth/*, login, signup                # Delegate to platform/shell/service
src/
  providers/                           # ONLY cross-cutting implementations
    gemini/                            # BYOK Founder Gemini (account key, any Project)
    supabase/                          # Auth + DB client factories
    workspace/                         # Node Workspace virtual FS; paths: …/projects/{projectId}/nodes/{nodeId}/…
  platform/
    types/                             # FounderId, ProjectId, NodeId, …
    registry/                          # Node catalog: unlock defaults (e.g. unlocked_at_boot); locked|unlocked per Project
    shell/
      types/
      config/
      repo/                            # projects, founder_api_keys (account), tour_completed, …
      service/                         # Project resolution, switcher, tour, Pitwall/Grid, account menu + API key
      runtime/
  journey/
    brain/                             # Sibling of platform/shell — not nested under it
      types/
      config/
      repo/
      service/                         # Brain API; always receives ProjectId from shell facade
      runtime/                         # Deep Agents graph steps, workspace tools
  nodes/
    interview-practice/                 # V1: Interview practice Node (simulator). Customer interview Node = future TBD
      types/
      config/
      repo/                            # Sessions, reports, ICP, progression — project_id scoped
      service/                         # Start/end session, report, profile, route policy
      runtime/                         # Voice session loop, persona gen adapters, evaluation transport
tests/*
docs/adr/*
docs/vision/*
```

**`app/onboarding/tour/*`:** first-run tour (**Back**, **Next** only). Penultimate: **Founder API Key** (**required** in v1—block **Next** until valid save). Final: **Project** name + create → `/projects/[projectSlug]/pitwall` (**composer state**). Post-v1 optional key on tour: **TBD**.

**`app/projects/[projectSlug]/pitwall`:** **composer state** = center composer + onboarding chat until complete (agent onboarding prompt); **operational state** = CopilotKit/OpenUI after onboarding finishes—**not** triggered by **Session** alone. **Project switcher** inline-create → **composer state**.

**`app/projects/[projectSlug]/*`:** layout resolves slug → `project_id`, founder ownership. **Agent chat rail** on **Grid**, operational **Pitwall**, and **nodes**/**Active Node surfaces**—omitted in **Pitwall composer state** only.

**`app/*` (shell):** imports **only** `platform/shell/service` and `nodes/*/service` facades (and re-exported view types). Never `providers`, `journey/brain` internals, `effect`, or slice `types/repo/runtime` directly.

**`src/platform/shell/service`:** auth; **Project** CRUD and switcher (slug + id); feature-tour completion (account); **Founder API Key** (account); **Pitwall**/**Grid**; **`journey/brain/service` facade** always passed `project_id` resolved from route slug.

**`src/journey/brain`:** long-horizon meta-agent per **Project**; **Journey milestone** replanning; attaches **Node** plugins via **Node Skill** (prompt baseline + progressive disclosure); read/write **Node Workspaces**; **Pitwall** synthesis; no interview voice turns in v1.

**`src/nodes/interview-practice`:** **Node Runtime** for voice **Session**, persona, evaluation, report, **Profile Settings** / ICP, progression — all **`project_id`**-scoped. **Journey Brain** reads interview **Node** plugin outputs via **Node Workspace** sync and skills—not by owning interview routes.

**`src/providers`:** Gemini BYOK, Supabase, workspace FS. Slices use provider interfaces only.

### Legacy (migrate away — do not extend)

Agent routing table: [docs/MIGRATION-MAP.md](docs/MIGRATION-MAP.md).

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
| `infrastructure/supabase/*` | `providers/supabase` + platform/node `repo` |

**Migration note:** backfill one **Project** per existing founder before cutting shell routes.

### Horizontal layers (inside each vertical slice)

Every slice under `platform/shell`, `journey/brain`, and `nodes/*` uses **Types → Config → Repo → Service → Runtime** (forward-only). **UI** is **`app/*` only**.
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

- **One deployable:** single Next.js TypeScript modular monolith.
- **Two scopes:** **Founder account** (auth, **Founder API Key**, feature-tour-completed) vs **Project** (shell, brain, sessions, workspaces, **Founder context** for that startup).
- **Active Project:** exactly one **Project** context per shell session; **Project switcher** changes it; **Pitwall** must not blend two **Projects** in one view.
- **Shell gate:** no **Pitwall** or **Grid** until at least one **Project** exists (feature tour **last step**). First-run tour: **Back** / **Next** only (**no Skip**).
- **Project routes:** shell modules live under `/projects/[projectSlug]/…`; slug unique per founder account.
- **Project container lives in platform/shell:** not a fourth top-level slice beside `journey/` and `nodes/`.
- **Vertical slices:** `platform/shell`, `journey/brain` (sibling), `nodes/*`. **Forbidden:** sibling `nodes/*` imports; cross-slice `repo`/`service` imports; **Pitwall** nested under `journey/brain`.
- **Journey Brain:** scoped to **active Project**; **Pitwall** consumes brain output; **Pitwall is not the brain.**
- **Nodes are plugins:** **Node Runtime** owns in-session authority (interview v1); brain observes **Node artifacts** + **Node Workspace** files.
- **Layer direction (mechanical):** **Types → Config → Repo → Service → Runtime** within each slice; no skips, no reverse edges.
- **Providers only:** Gemini, Supabase, workspace FS via `src/providers/*` — no scattered `process.env` or SDK clients in slices.
- **`app/*` thin:** no domain rules, no `effect`, no `throw` in production paths; service facades only.
- **Parse at boundaries:** decode at repo/provider/runtime edges (parse, don't validate).
- **Gemini-only;** OpenRouter and Credits **removed**.
- **Platform store vs Node Workspace:** DB is structured truth (**project_id** on venture data); workspaces hold consolidated agent narrative per **Project** per **Node**.
- **Effect:** `Effect.runPromise` in `*/service/*` adapters only, not in `app/*` handlers.
- **Reconciliation:** invariant changes update this file and an ADR before code drifts.

## Boundaries

### Slice dependency matrix (target)

| From → To | Allowed |
|-----------|---------|
| `app/*` | `platform/shell/service`, `nodes/*/service` facades only |
| `platform/shell` | own layers, `platform/registry`, `platform/types`, `journey/brain/service` facade, `providers` |
| `journey/brain` | own layers, `providers`, `platform/registry` — **not** `nodes/*/repo` or `nodes/*/runtime` |
| `nodes/interview-practice` | own layers, `providers` — **not** `journey/brain`, **not** other `nodes/*` |
| `providers` | external packages only |

```text
app/*  →  platform/shell/service  →  journey/brain/service  →  providers
              ↓ (ProjectId on every shell/brain call)
          nodes/*/service  →  nodes/*/runtime  →  providers
          (project_id from shell context; no journey/brain import in v1)
```

### Layer edges (within each slice)

- Outer layers import only the **adjacent inner** layer.
- **`app/*` calls `service` only** for that slice.
- **Repo/Runtime** implement ports from **Types**; they do not import **Service**.

### Product seams

| Seam | Rule |
|------|------|
| **Onboarding → Shell** | Tour: API key (penultimate) → create **Project** (last) → `/projects/[projectSlug]/pitwall` **composer** → chat → **operational** when context sufficient |
| **Account vs Project** | Sidebar footer **account menu** + `app/settings/*`: **Founder API Key**, tour flags (account). `/projects/[projectSlug]/*`: **Pitwall**/**Grid**/brain/sessions (**project_id**) |
| **Pitwall ↔ Journey Brain** | `platform/shell/service` → `journey/brain/service` with **ProjectId** |
| **Project switcher** | `platform/shell/service` only; changes **active Project** then reloads shell routes |
| **Grid ↔ Nodes** | `platform/registry` (per-**Node** `locked`/`unlocked`, boot defaults); **Grid** in **composer state**; v1 **Interview practice** unlocked at boot |
| **Interview Node ↔ Brain** | **Platform store** + **Node Workspace** sync — no live voice coupling |
| **Persona / evaluation ↔ LLM** | ports in node **runtime**; transport via **providers/gemini** |
| **Auth** | `app/auth/*` → `platform/shell/service` → **providers/supabase** |

### Data plane

- **Account tables:** auth user, **Founder API Key** handles (encrypted), `feature_tour_completed` (or equivalent).
- **Project tables:** `projects` (founder_id, display name, slug/id); all venture rows include **`project_id`** (sessions, reports, progression, ICP, …).
- **Node Workspace paths:** `founders/{founderId}/projects/{projectId}/nodes/{nodeId}/…` via **WorkspaceProvider**.
- **RLS / access:** policies enforce `founder_id` + `project_id` (founder cannot read another founder's **Project**).

## Cross-cutting Concerns

**Routing:** primary shell URLs always include **`/projects/[projectSlug]/…`**. Middleware/layout resolves slug → `project_id`, enforces founder ownership, sets **active Project**. Gates: no **Projects** → `/onboarding/tour`; tour incomplete (account flag) → tour; else → last active or first **Project** **Pitwall** route.

**Request context:** composition root builds Effect layers from **Providers** with `founder_id` + `project_id` from resolved slug — not per-action env reads.

**Mechanical enforcement:**

- **[`.dependency-cruiser.cjs`](.dependency-cruiser.cjs)** — deny-list (`forbidden` rules only; no global `allowed` allow-list). Run via **`npm run architecture:check`** (CI fast job). Errors on `app/*`, `providers`, and `platform` boundaries; `domain-no-infrastructure` is warn with a `pathNot` carve-out for the OpenRouter generator until removal.
- **`tests/app-boundary-imports.test.ts`:** forbid `app/*` → `domain`, `infrastructure`, `providers`, `effect`, and `throw`.
- Auth routes use [`src/platform/shell/service/auth-route-support.ts`](src/platform/shell/service/auth-route-support.ts) instead of direct infrastructure imports.
- Optional: `scripts/check_layer_invariants.py` (`--layers types,config,repo,service,runtime`, `--provider-dirs providers`).
- **Project isolation tests:** switcher changes scope; repos reject missing/wrong `project_id`.

**Boundary parsing:** Supabase rows, LLM JSON, redirects decoded at repo/provider/runtime edges (Effect Schema per ADR-0013).

**Error shaping:** service facades map failures to stable categories; no adapter types in `app/*`.

**Security:** server-side auth; API keys never in client bundles or **Node Workspace** markdown.

**Testing:** behavior via **service** facades; structural import rules; parse tests for decoders.

**Migration:** `projects` table + backfill; stand up project-scoped routes beside legacy; delete `domain/`, `application/`, `infrastructure/`, OpenRouter, Credits. See `docs/vision/architecture-platform-and-nodes.md` §5.
