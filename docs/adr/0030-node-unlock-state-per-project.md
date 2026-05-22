# Node unlock state per Project

Each **Node** in the **Node catalog** has a persisted **unlock state** per **Project**: `locked` or `unlocked`. The **Grid** and **Node Runtime** read this state; the **Journey Brain** may transition `locked` → `unlocked` when journey rules are satisfied. “Pre-journey” is conversational language for **Nodes** whose catalog default is **unlocked at Project boot**—not a code category, enum, or folder.

**Why not a `pre_journey` type in code:** product language drifts; the software model should stay one state machine. Boot defaults, catalog dependencies, and brain policy compose without multiplying types.

**Three layers (keep separate):**

1. **Node catalog** (`platform/registry`) — product-owned definitions: `node_id`, dependencies, `unlocked_at_boot`, optional milestone tags (**TBD**). Immutable at runtime except via product releases.
2. **Project node state** (`platform/store`, e.g. `project_node_states`) — authoritative `locked | unlocked` per `(project_id, node_id)` for UI and gates. Initialized from catalog on **Project** create; updated by brain policy or explicit product rules.
3. **Journey Brain policy** (`journey/brain/service`) — may unlock **Nodes** using **Agent mission**, onboarding completion, **Bottleneck**, **Journey milestone**, and catalog deps. Must not invent **Node** types or write unlock state without going through a single service API.

**v1:** one shipped **Node** (**Interview practice**); catalog default `unlocked_at_boot: true`; **Grid** shows only shipped **Nodes** (no skeleton locked placeholders). State machine still exists so multi-node rollout does not require a migration of concepts.

**UI (post–v1):** locked **Nodes** remain **visible** on the map (grayed, not clickable) per product decision; unlock transitions should be explainable (optional `unlock_reason` metadata for support/debug—**TBD**).

**Rejected for v1:** hiding locked **Nodes** entirely; brain-only unlock with no catalog deps; catalog-only unlock with no brain override; `pre_journey` as an enum or package name in `src/`.
