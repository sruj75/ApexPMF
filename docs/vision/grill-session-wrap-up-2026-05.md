---
title: Grill session wrap-up — Projects, shell, onboarding
updated: 2026-05-22
status: decisions recorded
source: Founder grill-with-docs; canonical terms in CONTEXT.md
---

# Grill session wrap-up

Decisions from the **Projects + shell** grill. Full glossary: `CONTEXT.md`. Architecture: `ARCHITECTURE.md`. Node unlock ADR: `docs/adr/0030-node-unlock-state-per-project.md`.

## Account vs Project

- **Founder account** — auth, **Founder API Key** (required on feature tour penultimate step in v1), **account menu** in sidebar footer.
- **Project** — one startup idea; shell scoped to **active Project**; routes `/projects/[projectSlug]/…`.
- Multi-project; **Project switcher** on **Command** top bar (Vercel-style); inline create → new slug → **Command composer state**.

## Onboarding & Command

1. Sign in → **feature tour** (Back/Next only, no Skip) → penultimate **API key** → last step name **Project**.
2. `/projects/[slug]/command` → **Command composer state** (v0 center composer + ChatGPT-style onboarding chat).
3. Onboarding **must finish** (agent onboarding system prompt) → **Command operational state** (dashboard). **Sessions do not** unlock operational Command early.
4. **Grid** + **Start Practice** available during composer (soft nudges). **Agent chat rail** on Grid, operational Command, Active Node—not on composer.

## Nodes (v1)

| Node | Status |
|------|--------|
| **Interview practice** | Shipped — Mom Test simulator, `interview-practice`, unlocked at boot |
| **Customer interview** | Future TBD — real customer interviews; **not** the simulator |

- **Grid v1:** only shipped Node on map (no skeleton locked graph).
- **Profile Settings** / ICP: under `…/nodes/interview-practice/settings`; brain sees plugin context.
- **Node catalog** + milestone spine: **TBD** in `platform/registry` (first principles; Strunk-informed, not copied). `knowledge-graph/` **deleted**.

## Node unlock (engineering)

- Software: **`locked` \| `unlocked`** per Node per Project only.
- Conversation: **pre-journey Node** = unlocked at Project boot.
- Catalog defaults + brain policy; visible locked nodes on map when catalog grows.

## Deferred / TBD

- Pinned Nodes, Node work state, Journey milestone spine detail, feature tour step count/copy, onboarding field schema in system prompt, post-v1 optional API key on tour.
