# ApexPMF v1 — Product Requirements Document

**Status:** Directional PRD for v1 rebuild (alignment doc; many details remain **TBD per issue**).  
**Canonical language:** `CONTEXT.md`  
**Architecture:** `ARCHITECTURE.md`, `docs/vision/architecture-platform-and-nodes.md`  
**Planning style:** Ship iteratively; resolve open choices when implementing the issue that needs them.

---

## Problem Statement

Founders moving from zero toward product-market fit face two failures at once: they lack **systems-thinking speed** (bottlenecks, validated learning loops, what to do next), and they lack **safe practice** on critical skills such as customer discovery interviews. Generic AI chat does not combine a **long-horizon journey agent**, **structured PMF tooling**, and **specialist product surfaces** (voice practice, future Nodes) in one account.

Today’s codebase is a strong **Interview practice** simulator (Mom Test voice **Sessions**, reports, progression) without the **ApexPMF shell**: multi-**Project** workspace, **Pitwall** / **Grid**, **Journey Brain**, BYOK Gemini, or project-scoped routing. Founders need **Cursor-for-PMF**: persistent side agent, operational **Pitwall**, **Grid** of **Node** plugins, and interview practice as the first **Node**—not a credits-based lesson app.

---

## Solution

**ApexPMF** is a modular-monolith web app where a **Founder account** owns one or more **Projects** (startup ventures). Inside the **active Project**, the **Founder** uses:

1. **Feature tour** (first run) → **Founder API Key** (account) → create first **Project**
2. **Pitwall** — default home; **Pitwall composer state** for agent-led **conversational onboarding**, then **Pitwall operational state** for real operational synthesis (bottleneck, focus, what next)
3. **Grid** — PMF map with **one shipped Node** in v1: **Interview practice** (voice **Session** simulator)
4. **Agent chat rail** — Cursor-style right panel on **Grid**, operational **Pitwall**, and **Active Node surfaces** (not during composer onboarding)
5. **Journey Brain** — **deepagentsjs** harness (OpenClaw/Hermes-shaped: **Node Workspaces**, file tools, **Node Skills**); **Agent mission** via **configure system prompt** (0→1 PMF—not founder-authored “goals”)
6. **Interview practice Node** — existing voice loop, reports, **Progression**, **Ideal Customer Profiles** (project-scoped), synced **Node artifacts** for the brain

Billing is **bring your own key** (Gemini only). Platform **Credits**, OpenRouter, and subscriptions are **removed**.

---

## User Stories

### Account, tour, and Projects

1. As a visitor, I want a **Landing Page** that explains ApexPMF and routes me to sign up or log in, so that I can start a founder journey.
2. As a new **Founder**, I want to sign up and log in with Supabase auth, so that my work is private and persistent.
3. As a **Founder** with no **Projects**, I want a first-run **feature tour** with **Back** and **Next** only (no skip), so that I am guided without a form wizard.
4. As a **Founder** on the tour, I want to enter my **Founder API Key** on the second-to-last step and be blocked from **Next** until it saves, so that all Gemini usage runs on my account from day one.
5. As a **Founder** on the last tour step, I want to name my startup and create my first **Project**, so that I enter the shell scoped to that venture.
6. As a **Founder** with existing **Projects**, I want to land on my last **active Project**’s **Pitwall** route, so that I resume where I left off.
7. As a **Founder**, I want a **Project switcher** on the **Pitwall** top bar to search, switch, and inline-create **Projects**, so that I can work on multiple startups from one account.
8. As a **Founder** creating an additional **Project**, I want to skip the feature tour and land in **Pitwall composer state** for that **Project**, so that onboarding is per-venture without re-entering my API key.
9. As a **Founder**, I want **Founder API Key** settings under the account menu (not per-**Project** routes), so that key management is account-scoped and obvious.

### Shell layout (Cursor-for-PMF)

10. As a **Founder**, I want a left sidebar with **Pitwall** and **Grid** (and optional **Pinned Nodes** later), so that navigation matches the product model.
11. As a **Founder**, I want a center canvas that shows **Pitwall**, **Grid**, or an **Active Node surface**, so that one panel holds the primary work.
12. As a **Founder**, I want an **Agent chat rail** on the right on **Grid**, operational **Pitwall**, and **Active Node surfaces**, so that I can talk to the **Journey Brain** like Cursor’s side chat.
13. As a **Founder** in **Pitwall composer state**, I want the center composer and chat thread without the right rail, so that onboarding is not three chat UIs at once.
14. As a **Founder**, I want an account footer on the left sidebar (profile, settings, log out), so that account actions match familiar SaaS patterns.

### Pitwall and Journey Brain

15. As a **Founder** in a new **Project**, I want **Pitwall composer state** with a center prompt and conversation, so that the agent gathers **Founder context** conversationally.
16. As a **Founder**, I want **Pitwall** to move to **Pitwall operational state** only when conversational onboarding completes per agent rules—not because I finished an interview **Session**, so that operational views are grounded in venture context.
17. As a **Founder** in **Pitwall operational state**, I want real operational UI (weekly focus, **Bottleneck**, what next) via CopilotKit/OpenUI-style surfaces, so that **Pitwall** is not a placeholder dashboard.
18. As a **Founder**, I want the **Journey Brain** to operate under a product **Agent mission** (**configure system prompt**), so that the agent consistently steers toward PMF without me writing a “goal document.”
19. As a **Founder**, I want the agent to use **Founder context**, **Node artifacts**, and validated **Bottlenecks** as inputs, so that advice reflects my startup and work done.
20. As a **Founder**, I want to ask the brain questions in the **Agent chat rail**, so that I get journey-level help without replacing **Node** specialist UX.

### Grid and Nodes

21. As a **Founder**, I want **Grid** to show only shipped **Nodes** in v1 (no gray locked placeholders), so that the map is honest about what exists.
22. As a **Founder**, I want **Interview practice** unlocked at boot for my **Project**, so that I can practice customer interviews immediately.
23. As a **Founder**, I want to open **Interview practice** from **Grid** into a full **Active Node surface**, so that practice is a first-class **Node**, not a legacy route.
24. As a **Founder**, I want a compact **back** control from an **Active Node surface** to **Grid**, so that I can return to the map.
25. As a **Founder**, I want **Grid** available during **Pitwall composer state**, with soft nudges to finish onboarding, so that I am not hard-blocked from exploring.
26. As a **Founder**, I want **Customer interview** (real customer interviews) clearly out of v1, so that agents do not conflate it with the practice simulator.

### Interview practice Node (existing product, migrated)

27. As a **Learner** (founder in practice **Node**), I want **Start Practice** to begin a voice **Session** immediately without a pre-session form, so that practice stays frictionless.
28. As a **Learner**, I want **Start Practice** to require a valid **Founder API Key**, so that sessions never run without billing coverage on my Gemini account.
29. As a **Learner**, I want to run **Start Practice** during **Pitwall composer state**, so that practice is not gated on finishing onboarding chat.
30. As a **Learner**, I want a fresh **Customer Persona** per **Session** from **Active Ideal Customer Profile** or **Broad Practice Pool**, so that practice stays varied and realistic.
31. As a **Learner**, I want **Profile Settings** per **Project** to manage **Ideal Customer Profiles**, so that ICPs belong to the venture.
32. As a **Learner**, I want a voice-first **Session** with **Opening Context**, **Session Timer**, and end controls, so that the loop matches Mom Test practice.
33. As a **Learner**, I want no scores, **Progression**, or coaching hints during the **Session**, so that the conversation stays realistic.
34. As a **Learner**, I want **Hidden Evaluation** after the **Session** and a **Session Report** with evidence and next practice focus, so that feedback is post-session and actionable.
35. As a **Learner**, I want **Progression**, **Achievement Nodes**, and **Global Ranking** (or **Insufficient Data State**) on the **Practice Dashboard** inside the **Node**, so that skill growth stays in the practice surface for v1.
36. As a **Learner**, I want **Voice Failure** handled gracefully without switching to text chat, so that the product stays voice-first.
37. As a **Learner**, I want **Session Reports** and transcripts private with no public sharing in v1, so that practice stays safe.

### Data, workspace, and providers

38. As a **Founder**, I want session and report data in the **Platform store** scoped to **Project**, so that the web app has queryable truth.
39. As a **Founder**, I want consolidated summaries synced into **Interview practice**’s **Node Workspace** after milestones, so that the **Journey Brain** can search agent-ready artifacts without raw dumps every turn.
40. As a **Founder**, I want all LLM and voice calls to use my Gemini key via **FounderGeminiProvider**, so that provider wiring is consistent and BYOK.
41. As a **Founder**, I want OpenRouter and platform **Credits** removed, so that the product does not maintain legacy billing paths.

### Operations and quality

42. As a maintainer, I want new code under `providers/`, `platform/shell`, `journey/brain`, and `nodes/interview-practice` with layer rules enforced in CI, so that agents cannot collapse boundaries.
43. As a maintainer, I want legacy `app/practice`, `app/dashboard`, and flat `src/domain` migrated and deleted after cutover, so that the repo matches the target architecture.
44. As a **Founder**, I want project-scoped URLs (`/projects/[projectSlug]/pitwall`, `/grid`, `/nodes/interview-practice/...`), so that sharing and navigation reflect the active venture.

---

## Implementation Decisions

### Product and UX

- **Metaphor:** Cursor-for-PMF—not Cursor for coding. Side **Agent chat rail** + specialist **Node** surfaces + operational **Pitwall**.
- **Projects in v1 (Option A):** Multi-**Project** per account; **Project switcher**; all shell state **Project-scoped** except **Founder API Key** and tour completion (account-scoped).
- **Pitwall modes:** **Composer state** (onboarding chat) → **Operational state** (real dashboard). Transition driven by agent onboarding completion, **not** by completing an interview **Session**.
- **Agent mission:** Product-owned via **configure system prompt**; do not expose founder-authored “goal” settings. Onboarding field schema also lives in prompts—**TBD** during build.
- **Grid v1:** Render **only** **Interview practice**; **unlocked at boot**; no skeleton future **Nodes**.
- **Interview vs Customer interview:** Two distinct future **Nodes**; v1 ships **Interview practice** (simulator) only.
- **Progression:** Remains inside interview **Active Node surface** for v1.
- **Credits / OpenRouter:** Remove entirely; migrate to Gemini-only **Founder API Key**.

### Major modules (build or modify)

| Module | Responsibility |
|--------|----------------|
| **Providers** | `FounderGeminiProvider` (BYOK), `SupabaseProvider`, `WorkspaceProvider` (per-project, per-node paths); sole cross-cutting integrations |
| **Platform shell** | Auth, **Project** CRUD/slug resolution, feature tour, account menu, **Pitwall**/**Grid** facades, **Project switcher**, route guards |
| **Platform registry** | Shipped **Node** catalog metadata, unlock defaults (`unlocked_at_boot` for interview practice) |
| **Journey Brain** | **deepagentsjs** runtime: plan/act/observe, file tools, **Node Skills**, read/write **Node Workspaces**, synthesis for **Pitwall**; always scoped by `project_id` via shell facade |
| **Interview practice Node** | Voice **Session**, persona generation, hidden evaluation, reports, ICP/profile, progression—all **project_id**-scoped; post-session consolidation → **Node Workspace** |
| **App shell routes** | `onboarding/tour`, `projects/[projectSlug]/pitwall|grid|nodes/interview-practice`, `settings` (API key) |
| **Legacy retirement** | Delete credits domain, OpenRouter client, `app/dashboard`, `app/practice`, top-level profile routes after migration |

### Architecture boundaries (enforce mechanically)

- Vertical slices: `platform/shell`, `journey/brain` (**sibling**), `nodes/interview-practice`, `providers`.
- Horizontal layers per slice: **Types → Config → Repo → Service → Runtime**; UI only in `app/*` calling **service** facades.
- **Journey Brain** does not import interview **Node** internals; observes via **Node Workspace** + platform rows.
- **Pitwall** calls brain only through `platform/shell/service` facade.
- **Agent chat rail** omitted in **Pitwall composer state** only.

### Data and sync

- **Platform store:** `projects`, account `founder_api_keys`, project-scoped sessions/reports/progression/ICP, tour flags.
- **Node Workspace paths:** scoped `…/projects/{projectId}/nodes/{nodeId}/…`.
- **Consolidation:** Owned by **Interview practice Node Runtime** after session milestones (report ready, etc.); brain not required for voice loop in v1.

### Technical stack (unchanged unless ADR supersedes)

- Next.js modular monolith, TypeScript, Effect at service/runtime/provider boundaries, Supabase, Gemini Live + generate APIs, CopilotKit/OpenUI for operational **Pitwall**.

### Explicit TBD (decide in issues)

- **Founder context** fields collected in onboarding chat  
- **Founder API Key** encryption, validation UX, quota error copy  
- **Node Workspace** consolidation file schema for interview **Node**  
- **Feature tour** copy and visuals; rail collapse/mobile  
- **Pinned Nodes**, **Node work state**, gate-skip policy  
- **Founder** read UI for workspace files  
- **Node catalog** / **Journey milestone** spine in `platform/registry` (post–v1 graph expansion)  
- Public marketing promise wording  

---

## Testing Decisions

**Principles:** Test behavior through module **service** facades and provider contracts; avoid asserting prompt prose or provider payload formatting. Parse/decode tests at repo and LLM boundaries. Structural tests for import rules (`app/*` → facades only; no domain→infrastructure in new slices).

| Area | Approach |
|------|----------|
| **Platform shell** | Project slug resolution, ownership guards, tour gating, switcher create/switch, composer vs operational **Pitwall** mode selection |
| **Providers** | Gemini BYOK load failures; Supabase repo decoders (existing patterns) |
| **Interview practice Node** | Extend existing session/report/progression tests under `nodes/interview-practice`; session lifecycle, report generation, ICP rules |
| **Journey Brain** | Contract tests on facade inputs/outputs; workspace read after consolidation fixture; defer full agent eval harness to later issues |
| **App boundaries** | Extend `tests/app-boundary-imports.test.ts` for `app/*` → no `infrastructure`/`providers`; add dependency-cruiser when `architecture:check` lands |
| **Credits removal** | Delete or rewrite tests that assert credit ledger, free trial, OpenRouter paths |

**Prior art:** `tests/app-boundary-imports.test.ts`, session orchestrator tests, practice-entry tests, generated-session-case decode tests, progression/credit tests (to retire).

---

## Out of Scope

### v1 explicitly excluded

- Platform **Credits**, subscriptions, **Free Trial Session**, credit ledgers, OpenRouter  
- **Customer interview Node** (real interviews)  
- Multi-channel agent (Telegram, WhatsApp, etc.), bash/browser tool marketplace  
- Full OpenClaw clone; founder hand-editing **Node Workspace** files in UI  
- **Grid** skeleton of locked future **Nodes**  
- Teams, coaches, org accounts, shared reports, public report links  
- Text-chat **Sessions**, default **Audio Recording**, exact **Session** retry  
- Past-weakness personalization; startup idea form at **Session** start  
- Lesson-style form onboarding; founder-authored **Founder Goal** settings  
- Legacy top-level routes (`/dashboard`, `/practice`, …) after cutover  
- **Pinned Node** auto-workset rules; **Node work state** semantics (defer)  
- **North Star** / full PMF graph catalog finalization  
- Background job queues for report generation (stay direct post-session flow per ADR)  

### Post–v1 (direction only)

- Additional **Nodes** (ICP→leads, synthesis, **Customer interview**)  
- **Journey milestone** replanning on expanded **Grid**  
- Outcome flywheel / cohort learning (privacy-preserving)  
- Optional deferral of API key on tour; workspace read UI entry point  

---

## Further Notes

- **Planning style:** This PRD is alignment for founders and coding agents; implementation issues may narrow or override **TBD** items—update `CONTEXT.md` and ADRs when decisions land.  
- **Docs map:** Narrative grill → `docs/vision/product-vision-grill-synthesis.md`; architecture narrative → `docs/vision/architecture-platform-and-nodes.md` §9.  
- **Agent harness reference:** [deepagentsjs](https://github.com/langchain-ai/deepagentsjs); shape inspired by OpenClaw / Hermes-agent (workspace + tools + skills), integrated into ApexPMF surfaces—not a separate product fork.  
- **Issue breakdown:** Prefer incremental issues (providers + project routes → shell + composer → brain minimal → node migration → credits deletion → operational Pitwall) rather than one mega-PR.
