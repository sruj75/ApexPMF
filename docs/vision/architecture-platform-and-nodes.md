---
title: Architecture proposal — platform shell + node slices
updated: 2026-05-19
status: proposed
resolved_sibling_journey_brain: true
source: Founder grill session; reconcile with `ARCHITECTURE.md` when accepted
---

# Architecture proposal — platform shell + node slices

**Problem:** The refactor is bigger than the customer interview simulator. It adds **Pitwall**, **Grid**, **Journey Brain**, per-node **Workspace** namespaces, and BYOK Gemini—while keeping agent-generated code coherent ([Harness engineering](https://openai.com/index/harness-engineering/) style boundaries + [deep modules](https://www.amazon.com/Philosophy-Software-Design-2nd/dp/173210221X)).

**Recommendation:** Do **not** choose vertical *or* horizontal. Use **both**:

- **Vertical (product boundaries):** what ships as a **Node**, what is **platform shell**, what is **Providers**.
- **Horizontal (inside each boundary):** fixed layers with forward-only dependencies, enforced mechanically.

---

## 1. Product shape (drives folders)

| Boundary | Owns | v1 |
|----------|------|-----|
| **Platform shell** | Auth entry, **Pitwall**, **Grid** topology, founder profile, **Founder API Key** settings, navigation | Real **Pitwall** + **Grid** with one **Node** |
| **Journey Brain** | Deep Agents runtime; reads/writes **Node Workspaces** across **Node** plugins; **Pitwall** “what now”; **Grid** pathing | Minimal depth for one **Node** + future hooks |
| **Node: interview-practice** | Voice **Session**, persona, hidden evaluation, report, progression inside that **Node** | Current simulator, moved under `nodes/` |
| **Providers** | Gemini (voice + LLM), Supabase, encrypted key storage, workspace backend | BYOK; **no** OpenRouter; **no** Credits |

**Product language (verbatim):** **each node in the grid is its own workspace** — meaning a distinct **Node Workspace** (files) per **Node** **plugin**, while **Platform store** (database) holds structured UI truth. Consolidated summaries **sync** from database → **Node Workspace** after milestones.

**One Journey Brain** spans the founder and attaches to **Node** plugins (Codex-style); **Node Runtime** inside each **Node** owns in-session authority (interview v1).

---

## 2. Vertical vs horizontal (how they compose)

```text
                    ┌─────────────────────────────────────┐
                    │  app/  (thin UI: Pitwall, Grid,    │
                    │        Node Active Node surfaces)   │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   ┌──────────────┐           ┌──────────────┐           ┌──────────────────┐
   │ platform/    │           │ journey/     │           │ nodes/           │
   │ shell        │           │ brain        │           │ interview-practice│
   │ (Pitwall,    │           │ (Deep Agents,│           │ (Session loop)   │
   │  Grid, BYOK)  │           │  Workspace)  │           │                  │
   └──────┬───────┘           └──────┬───────┘           └────────┬─────────┘
          │                          │                            │
          └──────────────────────────┴────────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────┐
                          │ providers/       │
                          │ (only cross-cut) │
                          └──────────────────┘
```

**Vertical slices = deep modules at product level.** Each slice hides its own prompts, lifecycle, and policies.

**Horizontal layers = same dependency rule inside every slice** (Harness-style):

```text
Types → Config → Repo → Service → Runtime
         (UI lives in app/* only; calls Service or Application facades)
```

- **Types:** domain shapes, branded IDs, error unions (no Supabase rows, no fetch).
- **Config:** env + per-founder settings resolution (no business workflows).
- **Repo:** persistence + decode at boundary (parse, don’t validate).
- **Service:** use cases / policies owned by this slice.
- **Runtime:** long-running or provider-adjacent loops (voice session, agent graph step) when needed.

**Forbidden:** `nodes/interview-practice` importing `nodes/future-icp-leads` internals; any slice importing another slice’s `repo/` or `service/`; `app/*` importing `domain` or `infrastructure` directly.

---

## 3. What *not* to do

| Anti-pattern | Why it fails (Ousterhout) |
|--------------|---------------------------|
| **Only** one folder per Node, no layers | Becomes a junk drawer; agents (and humans) leak Supabase/Gemini into UI |
| **Only** global `domain/session`, `domain/credits` | Shallow shared modules; **Node** knowledge leaks across unrelated tools |
| **Temporal folders** (`read/`, `process/`, `write/`) | Information leakage across phases |
| **Copy-paste layer stacks per Node with no shared Providers** | Duplicated Gemini/key logic; drift |
| **Pitwall as a god package** | **Pitwall** is one **module** in **platform shell**, not the whole tree |

---

## 4. Providers (single cross-cutting interface)

Everything that is not owned by one product slice enters through **Providers**:

| Provider | Hides |
|----------|--------|
| `FounderGeminiProvider` | BYOK key load, model IDs, voice vs generate clients |
| `SupabaseProvider` | Auth session, DB client |
| `WorkspaceProvider` | Virtual FS backend (Deep Agents), per-founder + per-node paths |
| (future) `TelemetryProvider` | Logging, tracing |

**Journey Brain** and **Nodes** call `Providers.FounderGemini` — they do not read env keys or raw API keys.

---

## 5. Mapping from today’s codebase

| Today | Refactor target |
|-------|-----------------|
| `src/domain/session`, `persona`, `credits`, `progression` | `src/nodes/interview-practice/{types,repo,service,...}` |
| `src/application/start-session`, `end-session`, … | `src/nodes/interview-practice/service` + thin `app/nodes/interview/*` |
| `src/infrastructure/llm/openrouter.ts` | **Delete**; Gemini-only in `providers/gemini` |
| `src/domain/credits/*` | **Delete** for refactor |
| `app/dashboard`, `app/practice` | `app/pitwall`, `app/grid`, `app/nodes/interview` |
| (new) | `src/platform/shell`, `src/journey/brain` |

Migrate **incrementally:** stand up `providers/` + `platform/shell` + `nodes/interview-practice` beside legacy paths, cut over routes, then delete legacy.

---

## 6. Mechanical enforcement (Harness lesson)

Documentation is not enough for agent-heavy codebases. Add:

1. **Dependency rules** (dependency-cruiser or ESLint `import/no-restricted-paths`) encoding the diagram above.
2. **Structural tests** — e.g. `nodes/*` may not import sibling `nodes/*`; `app` may only import `*/service` facades or `application` entrypoints.
3. **Boundary parse tests** — repo decoders and LLM JSON shapes fail in CI when schemas drift.

Agents ship faster when **invariants** are mechanical, not tribal.

---

## 7. Software design score (target vs today)

| Area | Today (~7/10 in `SOFTWARE.md`) | Target after refactor |
|------|-------------------------------|---------------------|
| Depth | Good domain modules, but flat `domain/*` will not scale to many Nodes | Deep **Node** slices + deep **platform** + **Providers** |
| Information hiding | OpenRouter + Gemini split; credits cross-cut Session | One Gemini provider; BYOK in one place |
| Agent coherence | Some boundary tests | Layer rules + Node isolation enforced in CI |

**Target: 9/10** once layer lint + Node boundaries exist and Credits/OpenRouter are gone.

---

## 8. Resolved decisions

### `journey/brain` is a **sibling** of `platform/shell` and `nodes/*` (not nested under platform)

**Verdict:** **Sibling** — confirmed after the Codex plugin + **Node Workspace** / **Platform store** model.

| Piece | Role | Folder |
|-------|------|--------|
| **Journey Brain** | Agent spine (Deep Agents); attaches to **Node** plugins; reads **Node Workspaces** | `src/journey/brain/` |
| **Platform shell** | UI shell: auth, **Pitwall** + **Grid**, open **Node**, BYOK settings | `src/platform/shell/` |
| **Node** (e.g. interview) | **Plugin**: **Node Runtime** + DB truth + sync into **Node Workspace** | `src/nodes/interview-practice/` |

**Pitwall is not the brain.** Pitwall **consumes** brain output (bottleneck, what next). Nesting `journey/brain` under `platform/shell` would turn platform into a god package (Deep Agents, skills, graph runtime, CopilotKit wiring).

**Dependency direction:**

```text
app/*  →  platform/shell  →  journey/brain  →  providers
                ↓
            nodes/*   (writes Platform store + syncs Node Workspace;
                       does NOT import journey/brain in v1)
```

Optional: `platform/registry` — **Node** catalog / graph topology shared by **Grid** and **Journey Brain** without importing `nodes/interview-practice` internals.

### Still open (smaller)

1. **Pitwall → brain** only via `platform/shell/service` facade. **Recommend:** yes.
2. **Shared types** in `platform/types` (`FounderId`, `NodeId`, paths). **Recommend:** yes.

---

## 9. ApexPMF — one brain, many Nodes (product narrative)

> **One brain. Many Nodes. Each Node is its own workspace namespace.** Node code does the specialist work; the brain connects the journey.

That matches your sentence: **each node in the grid is its own workspace** — separate artifact home — while **one** meta agent still spans the whole trip to PMF.

### How they connect (story, not folders)

```text
Founder
   │
   ├─► Pitwall  ─────────► asks Journey Brain: "what's the bottleneck? what next?"
   │
   ├─► Grid     ─────────► map of Nodes; founder clicks one
   │
   └─► Active Node surface (e.g. interview practice)
           │
           │  runs real product logic (voice, traps, report)
           │  writes/reads THAT node's Workspace slice
           │
           ▼
       Journey Brain (always there in the backend)
           - sees activity across nodes
           - updates beliefs, files, pathing
           - may say: "constraint is interviews → open interview Node"
```

When the founder is inside the interview Node, they are mostly using **Node logic** (start practice, talk to persona, get report). The brain is **not** replacing that loop in v1.

When they are on Pitwall, they are mostly seeing **brain output** (synthesis, bottleneck, next step)—grounded in Workspace from **all** Nodes they have touched.

When they are on the Grid, they see **topology + state** (which Nodes exist, maybe “you are here / recommended next”). The brain may have suggested that path; the Grid is the **map, not the brain**.

**So:** Nodes are where work happens. Pitwall is where sense-making happens. The brain is the continuous thread behind both.

### OpenClaw mental model (tightened)

OpenClaw ≈ **one agent** + **workspace files** + **tools** (read, write, grep, maybe subagents).

Map that to ApexPMF:

| OpenClaw idea | Your product |
|---------------|--------------|
| Workspace | **Workspace** (partitioned per Node + shared founder-level context if you want) |
| Tools (bash, edit file, …) | **Node surfaces** + a small set of **brain tools** (read workspace, suggest next node, maybe run synthesis)—not “the whole UI is the tool” |
| User chats with agent | **Pitwall** + future chat-like affordances |
| Agent does work in files | After interview Node: notes, report summaries land in that Node’s workspace; brain can merge into “problem synthesis” later |

The interview Node is like a **heavy tool** the founder opens: it has its own UX and rules (Mom Test, voice, traps). When they close it, **artifacts** remain in that Node’s workspace for the brain to use elsewhere.

You are **not** rebuilding “interview as a chat with the meta agent” for v1. You are **embedding** the existing simulator **as** a Node the brain can see.

### Where this lands in architecture (concept only)

Think **spine + plugins**, not “brain folder inside every node”:

```text
        Journey Brain  ←── one runtime, one Workspace API, pathing, Pitwall feed
              │
    ┌─────────┼─────────┐
    │         │         │
 platform   Node A    Node B
 (Pitwall,  (interview) (future)
  Grid)      deep      deep
             module    module
```

- **Journey Brain** = shared spine (Deep Agents, TS-first, BYOK Gemini key via Providers).
- **Each Node** = vertical slice (deep module): owns Session/persona/report **inside** `interview-practice`.
- **Platform shell** = Pitwall + Grid + auth + “open this Node” — does **not** own persona generation or voice.

This is the same **sibling** layout as §8: `journey/brain` beside `platform/shell` and `nodes/*`, not nested under platform.

---

*Target contract: `ARCHITECTURE.md` (refreshed 2026-05-19). Still add ADR for platform / journey / nodes / providers matrix when implementing.*
