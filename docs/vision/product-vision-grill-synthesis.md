---
title: Product vision — grill session synthesis
updated: 2026-05-19
status: draft
source: Founder grill-with-docs session; canonical terms live in `CONTEXT.md`
---

# Product vision — grill session synthesis

This document captures what the founder described during a **grill-with-docs** session: the pivot from a voice-only Mom Test practice app toward a **0→1 PMF copilot**, plus **v1 scope** decisions. It is narrative and decision-oriented. `**CONTEXT.md`** remains the glossary and relationship contract for code, issues, and tests.

---

## 1. One-line thesis

**ApexPMF** is a PMF copilot for founders: a persistent **Journey Brain** plus **Workspace** artifacts, surfaced through **Command** (operational intelligence) and **Grid** (PMF node map), so founders move from zero toward product-market fit with **systems-thinking speed**—not only a checklist of tools.

---

## 2. Why this exists (demand)

- AI is compressing headcount inside companies; many people will not have traditional jobs.
- When building companies gets easier (like YouTube for creators), **many more** people will start companies; build cycles compress (years → months).
- Competition among startups will intensify; **velocity and focus** matter more.
- The product bets that a copilot can improve **how** founders operate (constraints, bottlenecks, tight learning loops) and **which** work they do next—not just hand them a static roadmap.

**Public promise (intent, not final marketing copy):** operational velocity in the sense fast builders are praised for—constraint focus, iteration speed, attacking the real bottleneck—not a narrow “guaranteed PMF in N months” claim until there is honest cohort evidence.

---

## 3. What we are building

### 3.1 Not just tabs—intelligent surfaces

Traditional products use a **fixed sidebar** (e.g. Vercel: Overview, Deployments, Logs, Analytics). This product uses:


| Surface           | Canonical name | Informal aliases                   | Role                                                                                                                                                                                                                         |
| ----------------- | -------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operational brain | **Command**    | **Dashboard**, **Mission Control** | Intelligent, evolving view: what’s going on, weekly focus, validated **Bottleneck**, what to do now. Built with [CopilotKit](https://github.com/copilotkit/copilotkit) and/or [OpenUI](https://github.com/thesysdev/openui). |
| PMF map + tools   | **Grid**       | **Playground**                     | **Prebuilt** graph of **Nodes** toward PMF (and **North Star**). Click a **Node** → full **Active Node surface** for that tool.                                                                                              |


**Naming rules:**

- **Command**, **Dashboard**, and **Mission Control** = **same module** (three words, one thing).
- **Grid** and **Playground** = **same module**.
- Do **not** use **Mission Control** for the whole app or for **Grid**.

### 3.2 Journey Brain (backend “OpenClaw-shaped” agent)

- One persistent agent runtime (conceptually like **OpenClaw** / a “brain”) holds **full journey context**.
- Implementation direction: LangChain **[Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview)** harness; **v1 runtime: TypeScript first** via **[deepagentsjs](https://github.com/langchain-ai/deepagentsjs)** alongside Next.js. Python `deepagents` only if a hard capability gap appears.
- **All Nodes** connect to the **same** Journey Brain; activity in one Node (e.g. voice practice sessions) is learned and stored for continuity.
- Intelligence is in **pathing** (next / skip / branch / alternate route) and **operating quality**, not in inventing new Node types at runtime without shipping them through the catalog.

### 3.3 Workspace vs Platform store (hybrid)


| Layer              | What it is                                                                               | Examples                                                            |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Workspace**      | Agent’s durable file tree; virtual paths for Deep Agents tools; narrative memory         | `icp.md`, interview notes, synthesis docs                           |
| **Platform store** | Postgres / Supabase (and LangGraph durable backing): enforceable, queryable system state | Auth, billing, entitlements, indexes, pointers to workspace objects |


**v1:** Workspace bytes **persist** across visits; primary backing is **Platform store** (Postgres / LangGraph-style persistence). Object buckets and sandboxes deferred until scale or untrusted execution Nodes need them.

**Founder read access:** v1 should allow founders to **read** Workspace artifacts; **where** in the UI is **TBD** (not assumed to live only inside Command). In-UI raw file editing is **not** committed for v1.

### 3.4 Nodes

- A **Node** is a **prebuilt** product surface in the PMF graph (tool + artifacts + place in topology)—**not** an LLM-generated tab on the fly.
- **V1:** exactly **one** Node on the Grid: **Interview practice** (Mom Test voice **Session** simulator with AI personas)—the product already built.
- **Not v1:** **Customer interview Node** (real customer discovery interviews—capture, synthesis, etc.)—**TBD**, separate from practice.
- **Later examples** (not v1): **Customer interview Node**, ICP → lead list, synthesis → roadmap-style outputs.
- **Node catalog** and **Journey milestone** spine: **TBD** in `platform/registry` (first-principles iteration; PMF-canvas-style direction, e.g. Christian Strunk framework, not blind adoption). Former `knowledge-graph/` folder **deleted**.

---

## 4. UI behavior (from wireframes and discussion)

### 4.1 Authenticated shell

```
Sidebar (always)
├── Command          ← default home after login
├── Grid
└── [Pinned Nodes…] ← optional; rules TBD

Main panel
├── Command view     ← CopilotKit / OpenUI operational UI
├── Grid map view    ← node graph (v1: one node)
└── Active Node surface ← full-width when a Node is selected from Grid
```

### 4.2 Opening a Node

- From **Grid**, the founder **clicks** a **Node** (same idea as “drill-in”; prefer plain language in UI).
- Main panel becomes the **Active Node surface**—**fully interactive**, not read-only.
- For **Interview practice Node**: existing chrome (**Practice Dashboard**: Start Practice, progression, reports, voice **Session** flow).
- **Practice Dashboard** ≠ **Command** (global ops vs practice **Node** UI). ≠ future **Customer interview Node**.

### 4.3 Back to the map

- Baseline: small `**<`** (or similar) control from **Active Node surface** back to **Grid** map.
- Breadcrumbs and fuller navigation IA: **not finalized**.

### 4.4 Command vs Grid (Q8)

- **Strict separation** in v1: Command does **not** host the full graph as its main canvas; Grid does **not** replace Command’s “what now” panel.
- **Cross-links** between modules are fine; **duplicating** the full graph inside Command is not.

### 4.5 Pinned Nodes (vision, not v1-final)

**Early sketch:** founder can pin any Node to the sidebar (from graph pin control or **settings → pin** in Active Node surface).

**Evolving vision:**

- Founders do **not** work all Nodes at once; focus follows the **current bottleneck** (e.g. weak discovery → **Interview practice** or **Customer interview Node** when it exists).
- **Node work state** (product state, agent judgment, or both—**TBD**) marks progress; when a constraint is “good enough,” the brain steers to the next Node.
- Sidebar may show only **active workset** Nodes (often one, sometimes two parallel); completed Nodes drop from prominence automatically.
- Tied to **Command** “what now” story.

**Deferred:** confirm-first vs auto-advance when leaving a Node; pin caps and overflow.

---

## 5. Systems thinking (how Command should “think”)

The product optimizes **how** the startup runs, not only **which** Node is next.

**Constraint loop (first principles):**

1. What is the goal?
2. What is the current bottleneck?
3. Is it real or assumed?
4. Is it physics/legal, or human/institutional inertia?
5. What is the smallest test to break it?

**Core truth:** a system improves at the speed of its **tightest bottleneck**—but do not “attack constraints” blindly; validate first.

**Command’s job (metaphor, not user-facing copy):** give founders an operational picture similar to what a fast operator keeps in their head—bottleneck, leverage, next action—without requiring them to map the system themselves.

Influences named in discussion: *Thinking in Systems* (Donella Meadows), fast iteration / constraint focus (discussed in terms of how certain builders are praised for speed—not literal “Elon mode” in the UI).

---

## 6. V1 scope (locked direction)


| Area                                              | V1                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Command**                                       | **Real** surface (CopilotKit/OpenUI), not a placeholder                                                                               |
| **Grid**                                          | **Interview practice Node** only on the map (no skeleton locked placeholders in v1)                                                    |
| **Active Node surface**                           | Full existing interview experience (voice **Session**, reports, **Progression**, etc.) — **no** platform **Credits**                  |
| **Routing**                                       | **New backend architecture**; **no** legacy top-level routes for this shell slice                                                     |
| **Journey Brain + Workspace**                     | Whatever depth the **rebuilt backend** needs for Command + one Node + sessions (incremental; not “full multi-node brain” before ship) |
| **Pinned Nodes / Node work state / auto workset** | **Deferred** until baseline loop works                                                                                                |
| **Graph catalog**                                 | One shipped Node; full catalog + milestone spine **TBD** in `platform/registry`                                                       |


**After login:** land on **Command** by default; reach interview practice via **Grid → Node → Active Node surface**.

**Still includes (inside interview Node):** Landing Page, auth, Profile Settings, **Founder API Key** setup, Start Practice, Voice Conversation, Session Report, Report Generating State, Progression, Achievement Nodes, Insufficient Data State for ranking—per `CONTEXT.md`.

**Refactor — provider & billing (grill, 2026-05-19):**

| Change | Decision |
|--------|----------|
| LLM providers | **Remove OpenRouter**; **Gemini API only** for non-live LLM (persona generation, hidden evaluation, Journey Brain) and voice (Gemini Live). |
| Monetization | **Remove** subscription, platform **Credits**, free-trial billing, and credit ledgers. |
| New model | **Bring your own API key** — founder pastes a **Gemini API key**; ApexPMF runs sessions and LLM on their account. No in-app pricing. |

**TBD:** encrypted key storage, single key for all Gemini surfaces vs split, quota/error UX when the key fails.

---

## 7. Longer-term vision (post–v1, not finalized)

- Expand **Grid** with many **prebuilt** Nodes and edges (gates, deps)—catalog **TBD** in `platform/registry`.
- **Flywheel:** outcome-linked learning (who reaches PMF faster, with what behaviors) to sharpen the agent—**privacy-preserving**, no fake “PMF probability” precision.
- Examples: ICP → lead list, interview synthesis → product ideas / roadmap inputs.
- **North Star** beyond PMF on the graph where appropriate.

---

## 8. Grill session — decisions and deferrals


| #   | Topic                           | Resolution                                                                                                                 |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| —   | Hero loop                       | **Command** + **Grid** + **Journey Brain**; **Interview practice** is **one Node**, not the whole product                    |
| —   | Node spawning                   | **Prebuilt** catalog; agent advises **pathing**, does not invent Node types ad hoc                                         |
| 6   | TS vs Python for Deep Agents    | **TypeScript / deepagentsjs first**                                                                                        |
| 7   | Founder Goal before heavy Nodes | **Deferred** (reframed after prebuilt-graph clarification)                                                                 |
| 8   | Command vs Grid                 | **Strict separation** + links                                                                                              |
| 9   | Skip gates / deps               | **Deferred**                                                                                                               |
| 11  | Back to Grid map                | `**<`-style control**; breadcrumbs **TBD**                                                                                 |
| 12  | Sidebar pins                    | **Vision in flux** (active workset + Node work state); manual pin sketch may coexist until reconciled                      |
| 13  | Public promise framing          | **Deferred**; intent = operational velocity, not forced outcome vs capability marketing split                              |
| 14  | Simplest v1 spine               | **Real Command** + **Grid (one Node)** + **interactive** Active Node surface; rebuild architecture, no legacy shell routes |
| 15  | LLM provider                    | **Gemini only**; delete OpenRouter                                                                                       |
| 16  | Billing                         | **BYOK** (**Founder API Key**); no subscription or Credits                                                               |
| —   | `journey/brain` vs platform     | **Sibling slice** — not nested under `platform/shell`; see `[architecture-platform-and-nodes.md](./architecture-platform-and-nodes.md)` §8 |
| 17  | Brain data diet                 | **Sync both**: **Platform store** (DB) + **Node Workspace** (files); consolidation owned by **Node Runtime** after milestones |
| 18  | Who runs consolidation          | **Node Runtime** (e.g. post-session), not a hard brain dependency for interview v1 |


**Architecture detail:** [architecture-platform-and-nodes.md](./architecture-platform-and-nodes.md) — vertical **Node** plugins + horizontal layers; **Providers** only cross-cut.

---

## 9. What is explicitly not finalized

- Breadcrumb / full navigation IA
- Pinned Node rules (manual vs auto, caps, overflow)
- Node work state semantics (code vs agent judgment)
- Founder Goal gates before expensive Nodes
- Gate / dependency skip policy (confirm vs auto)
- Where founders read Workspace files in the UI
- External marketing copy for “fastest path to PMF”
- Final **Node catalog** IDs, edges, **Journey milestone** spine, and gates in `platform/registry` (first-principles design **TBD**)

---

## 10. Related repo docs


| Doc                                                                                                              | Purpose                                                               |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `[CONTEXT.md](../../CONTEXT.md)`                                                                                 | Canonical language, relationships, Session/Node details               |
| `[ARCHITECTURE.md](../../ARCHITECTURE.md)`                                                                       | Technical architecture contract                                       |
| `[architecture-platform-and-nodes.md](./architecture-platform-and-nodes.md)`                                     | Platform + node slices proposal                                       |
| `[docs/adr/](../../docs/adr/)`                                                                                   | Durable engineering decisions (Session-era; reconcile as shell ships) |


---

## 11. Glossary quick reference


| Term                    | Meaning                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Command**             | Global operational sidebar module (= Dashboard = Mission Control)             |
| **Grid**                | PMF node map sidebar module (= Playground)                                    |
| **Active Node surface** | Full main-panel UI for one selected Node                                      |
| **Interview practice Node** | Mom Test simulator (**v1**); not **Customer interview Node** (future)      |
| **Customer interview Node** | Real customer interviews—**future** **TBD**                                 |
| **Practice Dashboard**  | Chrome **inside** **Interview practice Node** only                           |
| **Journey Brain**       | Shared Deep Agents runtime across Nodes                                       |
| **Node Workspace**      | Per-**Node** plugin files for **Journey Brain** (markdown, summaries, SKILL) |
| **Platform store**      | Postgres/Supabase — UI source of truth for sessions, reports, progression   |
| **Node**                | Prebuilt Grid **plugin** (Codex-style): Runtime + Skill + Workspace           |
| **Node Runtime**        | In-**Node** product logic (e.g. interview voice loop); owns session authority in v1 |
| **Founder**             | Account owner on 0→1 journey                                                  |
| **Founder API Key**     | BYOK Gemini credential for all model calls in the refactor                    |
| **Gemini provider**     | Sole LLM/voice provider (OpenRouter removed)                                  |
| **Learner**             | Founder while in the interview Session Node                                   |
| **Bottleneck**          | Validated tightest limit on progress toward Founder Goal                      |
| **North Star**          | Long-horizon anchor beyond PMF                                                |


---

*This file is a synthesis of founder conversation; when it conflicts with `CONTEXT.md`, update both deliberately—`CONTEXT.md` wins for implementation contracts until explicitly changed.*