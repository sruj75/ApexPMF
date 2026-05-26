# ApexPMF

The authenticated ApexPMF shell for a **Founder** account: the **Founder** may own multiple **Projects** (one startup idea each toward PMF). The **shell** (**Pitwall**, **Grid**, **Agent chat rail**, **Journey Brain**, **Node Workspaces**, **Sessions**) runs inside exactly one **active Project** at a time, switched via a Vercel-style **Project switcher** in the **Pitwall** top bar. **Founder API Key** is configured once per **account**, not per **Project**. Primary sidebar modules per **Project** are **Pitwall** and **Grid** only in v1 (no Overview/Analytics-style tabs yet). _Informal alias_: **Grid** is also called **Playground**. **V1** ships a **real Pitwall**, a **Grid** with one **Node** (**Interview practice** simulator), and a fully interactive **Active Node surface** for that **Node**—opened from the **Grid** by normal interaction (for example click), not a read-only preview. A separate **Customer interview** **Node** (real customer conversations) is **future**—**not** the simulator.

## Language

**Pitwall**:
The primary sidebar **module** for working with the **active Project**. It has two canvas modes: **Pitwall composer state** (onboarding chat until complete) and **Pitwall operational state** (operational synthesis after onboarding finishes per agent onboarding prompt).
_Avoid_: Using **Mission Control**, **Command**, or **Dashboard** for this module; using retired names for the whole app shell or **Grid**; showing full operational synthesis before there is data; confusing **Pitwall** with interview **Practice Dashboard** chrome

**Pitwall composer state**:
The default **Pitwall** canvas when a **Project** has little or no operational data yet: a v0-style **center composer** (prompt input) and a ChatGPT-style conversation thread in the main panel where the **Journey Brain** gathers **Founder context** about the startup. No bottleneck widgets, weekly focus cards, or CopilotKit/OpenUI operational dashboard yet. Reference: `docs/vision/onboarding-reference/Screenshot_2026-05-22_at_11.32.24_AM-*.png` (composer), `…_11.35.20_AM-*.png` (conversation).
_Avoid_: Empty placeholder **Pitwall** with no agent conversation; a separate onboarding page that duplicates this chat

**Pitwall operational state**:
The **Pitwall** canvas once **`ONBOARDING.md`** onboarding is **finished** and **`ONBOARDING.md`** is removed/archived—required **Founder context** must be gathered in that ritual (not substitutable by **Interview practice Sessions** or **Node artifacts** alone). Then real operational synthesis can render (weekly focus, **Bottleneck**, what next)—**CopilotKit** and/or **OpenUI**. May coexist with **Agent chat rail** on the right.
_Avoid_: Fake/static dashboard before onboarding completes; promoting to operational **Pitwall** because a **Session** finished; calling composer state "broken Pitwall"

**Pitwall composer**:
The centered prompt input in **Pitwall composer state** (v0-style "what do you want to work on" pattern); primary input for **conversational onboarding** and ongoing **Journey Brain** dialogue in that state.
_Avoid_: Confusing with interview voice input or **Grid** search


**Command** (deprecated term):
Do **not** use for the global shell module. Prefer **Pitwall**. Legacy docs and issues may say **Command**, **Dashboard**, or **Mission Control** until renamed.
_Avoid_: Using any retired name in new product copy or routes

**Dashboard** (deprecated term, global module):
Do **not** use for the global operational sidebar module. Prefer **Pitwall**. **Practice Dashboard** is a different term (interview **Node** chrome only).
_Avoid_: Collapsing **Pitwall** and **Practice Dashboard**

**Mission Control** (deprecated term):
Do **not** use. Prefer **Pitwall** for the global operational sidebar module.
_Avoid_: Using **Mission Control** for the whole app shell or **Grid**

**Agent chat rail**:
A persistent right-side chat panel (Cursor IDE–style) on **Grid**, **Pitwall operational state**, and **Active Node surfaces**—**v1 includes Grid** even when only **Interview practice** is on the map. **Not** shown in **Pitwall composer state** (center composer thread is enough). Product metaphor: **Cursor for getting to PMF**, not Cursor for coding.
_Avoid_: Three chat surfaces at once (composer thread + rail + practice voice); rail on **Pitwall composer state**

**Agent mission**:
The product-owned objective for the **Journey Brain**, set via **configure system prompt** (for example steer the **Founder** from zero toward product-market fit)—**not** a free-form goal the **Founder** authors. Prompt wording lives in implementation config, not in founder-facing "goal" settings.
_Avoid_: **Founder Goal** as a text box the **Founder** must write; documenting system-prompt prose in `CONTEXT.md`

**Project**:
One startup idea the **Founder** is taking toward PMF inside ApexPMF; the scope boundary for **Pitwall**, **Grid**, **Journey Brain** continuity, **Node Workspaces**, **Sessions**, and **Founder context** for that venture. A **Founder** account may own many **Projects** but works in one **active Project** at a time (Vercel-style).
_Avoid_: Supabase infrastructure "project"; calling **Project** a **Node Workspace**; using "workspace" alone when you mean this container

**Active Project**:
The **Project** currently selected in the shell; all authenticated product routes and agent memory for the shell refer to this **Project** until the **Founder** switches.
_Avoid_: Mixing data from two **Projects** in one **Pitwall** view without an explicit switch

**Project switcher**:
Top-bar control on **Pitwall** (Vercel-style: searchable list, **create new Project** inline). Creating a **Project** uses a small name field in the dropdown (**Option A**); on save, navigate to `/projects/[projectSlug]/pitwall` in **Pitwall composer state** and start **conversational onboarding** for that venture. Switching **Projects** changes **Project route** and loads that **Project**'s **Pitwall** mode (composer vs operational) from its data.
_Avoid_: Full-page create flow for v1 additional **Projects**; switching **Project** without updating the URL

**Project route**:
URL segment that scopes the shell to one **Project**, for example `/projects/[projectSlug]/pitwall`, `/projects/[projectSlug]/grid`, `/projects/[projectSlug]/nodes/interview-practice/...`. **projectSlug** is unique per **Founder account**; stable **Project** id lives in the **Platform store**. Slug policy is service-owned: derive from project display name, enforce per-account uniqueness with readable suffixes (`-2`, `-3`, ...), and keep slug stable after create even if display name changes.
_Avoid_: **Active Project** only in cookies with opaque `/pitwall` URLs; query-param project switching as the primary model

**Founder account**:
The authenticated identity (auth user) that may own multiple **Projects** and one **Founder API Key** shared across all **Projects**.
_Avoid_: Treating **Founder account** and **Project** as the same scope

**Founder context**:
Basic information about the **active Project**'s startup (fields and schema **TBD**); gathered during **`ONBOARDING.md`** conversational onboarding and persisted in **Project** workspace files (paths **TBD**), not a rigid multi-step form wizard.
_Avoid_: Lesson-style onboarding screens; treating **Founder context** as the same thing as **Agent mission**; storing **Founder context** at account level when it describes one venture only

**Grid**:
The sidebar **module** whose default view is the PMF **Node** graph; selecting an **unlocked** **Node** opens its **Active Node surface** in the main panel until the **Founder** returns to the map (baseline: compact **back** affordance such as `<`; breadcrumbs and fuller nav IA **not** finalized). Available during **Pitwall composer state** (onboarding)—the **Journey Brain** may nudge "finish context first" but does not hard-block the sidebar. **V1:** shows **only** shipped **Nodes** (one interview practice **Node**)—**no** skeleton map of locked future **Nodes** until the **Node catalog** spine exists in `platform/registry`. _Informal alias_: **Playground** (same module).
_Avoid_: Treating **Grid** as a throwaway demo; locking **Grid** until **Pitwall operational state** in v1; grayed placeholder **Nodes** on the map in v1

**Active Node surface**:
The full-width main-panel experience for one selected **Node** from the **Grid** (for example click). For **Interview practice**, this hosts the Mom Test voice **Session** simulator (progress, reports). A widget-style layout here is **not** the global **Pitwall** module. A **Founder** may pin this **Node** from the graph or from in-surface settings so it also appears as a **Pinned Node**; a compact control (for example `<`) returns to the **Grid** map, with richer breadcrumbs later.
_Avoid_: Calling node open "drill-in" in user-facing copy if the team prefers plain language ("open the **Node**"); confusing global **Pitwall** with **Node**-local layouts; hosting **Customer interview** (real interviews) UX inside the practice simulator **Node**

**Pinned Node**:
A sidebar shortcut to an **Active Node surface** for a specific **Node**, listed after **Pitwall** and **Grid**. May be **Founder**-initiated (pin from graph or settings) and/or **system- or agent-surfaced** as part of the **active workset** when the **Journey Brain** steers the **Founder** toward current bottlenecks—exact rules **not** finalized.
_Avoid_: Treating pins as a second graph; treating sidebar clutter as acceptable without a future cap, overflow, or auto-retire story once behavior ships

**Active workset**:
The small set of **Nodes** treated as live work at once (often one bottleneck-focused **Node**, sometimes two in parallel per current vision); expected to align with **Pitwall** "what now" and with which **Pinned Nodes** deserve prominence when auto-surfacing exists.
_Avoid_: Implying every catalog **Node** is simultaneously actionable

**Node work state**:
Where a **Node** sits in its lifecycle for a **Founder** (for example not started, in active attack, satisfied enough to move on); may combine deterministic product state and **Journey Brain** judgment—**not** finalized, but drives pathing, **Pitwall** focus, and envisioned auto pin/unpin behavior.
_Avoid_: Pretending "done" is always a binary checkbox unless the product defines it that way

**Journey Brain**:
The single meta-agent runtime built on **[deepagentsjs](https://github.com/langchain-ai/deepagentsjs)** in an **OpenClaw / Hermes-agent–shaped** harness: persistent **Node Workspaces**, file tools (read, write, search), **Node Skills**, plan → act → observe → update. It spans the **active Project**'s **long-horizon journey** toward PMF (weeks to months—not a single short coding-agent session). It **intelligently** chooses pathing, **Journey milestone** focus, and which **Node** **plugins** to use when—within the **Node catalog** and **Node Skill** contracts (not traditional hardcoded app logic, not inventing new **Node** types). It is **not** the in-session authority inside specialist **Node Runtime** UX (for example voice turns in interview practice).
_Avoid_: A second brain per **Node**; one-shot plan-then-execute like a coding agent for the whole PMF trip; treating **Journey Brain** as a replacement for **Node Runtime**; calling the interview voice loop "the brain"

**Journey milestone**:
A chapter of work toward PMF on the **Grid**; the **Journey Brain** **replans per milestone** rather than planning once for the entire journey. **Spine (TBD):** likely inspired by PMF canvas-style stages (for example segment → problem → solution → channel → model per [Christian Strunk's PMF framework](https://www.christianstrunk.com/blog/pmf-framework))—rethought from first principles and iterated in-product, **not** adopted blindly from any single external outline. **Journey milestones** are product-shaped stages; **Achievement Nodes** are interview-skill milestones inside the practice **Node**—different concepts.
_Avoid_: Collapsing **Journey milestone** with **Achievement Node**; assuming one immutable plan at **Project** start; copying a blog outline into the **Grid** without product review

**Node catalog**:
The prebuilt registry of **Nodes** on the **Grid** (IDs, dependencies, per-**Node** default **unlock** at **Project** boot, **Journey milestone** mapping **TBD**)—owned by product via `platform/registry`, **not** invented by the LLM at runtime. **No** `pre-journey` (or similar) **code category**—only **locked** / **unlocked** state per **Node** per **Project**. The **Journey Brain** applies intelligent unlock, nudges, and **Journey milestone** planning **on top of** this catalog.
_Avoid_: A `pre_journey` enum or folder in software; flat ad-hoc tools with no shipped **Node Skill**

**Node Runtime**:
The product-owned logic inside a **Node**'s **Active Node surface** (workflows, UI, policies)—for example persona generation, voice **Session**, **Hidden Evaluation**, **Session Report** in the interview **Node**. May be traditional SaaS (human does the work), agent-led, or human-in-the-loop; the **Journey Brain** observes and connects, it does not reimplement **Node Runtime** rules in v1.
_Avoid_: Calling **Node Runtime** "the agent" when we mean **Journey Brain**

**Node Skill**:
A packaged instruction and capability bundle for a **Node** **plugin** (analogous to Codex/`SKILL.md`): baseline context in the **Journey Brain** system prompt for that **Node** type, plus **progressive disclosure**—extra skill/workspace context loads only when the agent decides it needs it (file tools, read/search **Node Workspace**, etc.). Declared per **Node** in the **Node catalog**, not invented per chat.
_Avoid_: Loading every **Node**'s full skill corpus on every turn; one global skill file with no per-**Node** boundaries

**Node artifact**:
Structured output written after **Node Runtime** work: canonical rows live in the **Platform store** (database) for product UI; **consolidated** summaries and agent-ready files are **synced** into that **Node**'s **Node Workspace** so the **Journey Brain** can search and use them without loading all raw data every time.
_Avoid_: Only database with no **Node Workspace** sync; dumping raw transcripts into **Node Workspace** with no consolidation step

**Interview practice Node**:
The **v1** shipped **Node**: Mom Test–style **voice Session** practice with generated **Customer Personas** (simulator)—**not** real customer interviews. Code slice: `interview-practice`; routes like `/projects/[projectSlug]/nodes/interview-practice/…`. **Unlocked at Project boot** in the **Node catalog** (conversation: a **pre-journey Node**). **Journey Brain** consumes its **Node Skill**, **Node Workspace**, and **Node artifacts** like any **plugin**.
_Avoid_: Calling this **Customer interview**; a `pre_journey` type in code

**Customer interview Node**:
A **future** **Node** (**TBD**) for **actual** customer discovery interviews (real people, capture, synthesis, roadmap-style outputs)—separate product surface from **Interview practice**. **Not** shipped in v1; do not conflate with the simulator.
_Avoid_: Treating voice practice with AI personas as "customer interviews"; merging ICP/settings from practice into this **Node**'s UX before it exists

**Node**:
A **prebuilt** unit on the **Grid**: a **plugin** the **Journey Brain** can attach to (like Codex plugins)—each **Node** has its own **Node Workspace**, **Node Skill**, and **Node Runtime**. **V1** ships only **Interview practice** on the **Grid**. **Later:** more **Nodes** (including **Customer interview**) appear per **Node catalog** and **Node unlock** rules. In product language: **each node in the grid is its own workspace**.
_Avoid_: "Random widget," implying every **Node** is generated at runtime without product review; collapsing **Interview practice** and **Customer interview** into one **Node**

**Node unlock state**:
Per **Node**, per **Project**: **locked** or **unlocked** (the software model—every **Node** has one). **Unlocked** **Nodes** are clickable; **locked** **Nodes** stay **visible on the map** (grayed/disabled, path hint) until unlocked. Initialized from **Node catalog** (for example **unlocked at Project boot**); **Journey Brain** may unlock later per policy. Three layers: catalog definitions, persisted **Project** state, brain policy—see `docs/adr/0030-node-unlock-state-per-project.md`.
_Avoid_: Hiding locked **Nodes** entirely; a `pre_journey` category in code; LLM inventing new **Node** types

**Pre-journey Node** (conversational):
Product language for a **Node** that is **unlocked at Project boot** (among several that may be). **Not** a code category, enum, or separate module—implement as **unlocked** via catalog default only. **Interview practice** is one; more may ship later.
_Avoid_: `enum PreJourney`; routing or folders named `pre-journey/` in `src/`

**Node Workspace**:
The agent-facing file tree for one **Node** **plugin** (markdown and other paths the **Journey Brain** can read, search, and write via Deep Agents file tools). Holds consolidated summaries and agent-durable context—not necessarily every raw database row. The **Journey Brain** uses **Node Workspace** when operating in that **Node**; it does not need to ingest all raw product data on every turn.
_Avoid_: Calling **Node Workspace** "the database"; expecting the brain to load unconsolidated raw telemetry by default

**Platform store**:
The **database** (for example Postgres via Supabase): source of truth for traditional web-app state—auth, **Founder API Key** handles (account-scoped), **Project** records, **Project**-scoped **Session** rows, **Session Report** JSON, progression, and other product UI data. After meaningful **Node Runtime** events, consolidated summaries are **synced** into the matching **Node Workspace** under that **Project** so **Pitwall** and the **Journey Brain** share one story without duplicating authority.
_Avoid_: Using "platform store" when you mean **Node Workspace** files; storing **Founder API Key** secrets only in markdown files

**Founder**:
The person behind a **Founder account**; may run multiple **Projects** (startup ideas) and use multiple **Nodes**, including voice **Sessions**, inside the **active Project**.
_Avoid_: Anonymous "user" when we mean the account owner; conflating **Founder** with a single implicit startup when **Projects** exist

**Founder Goal** (deprecated term):
Do **not** use for founder-authored OKRs. Prefer **Agent mission** (product-owned, **configure system prompt**) and **Founder context** (founder-supplied basics). Legacy docs may still say **Founder Goal** until renamed.
_Avoid_: Asking the **Founder** to "set their goal" in settings

**Bottleneck**:
The tightest validated limit on progress toward product-market fit for this **Founder**'s situation; the **Journey Brain** prioritizes high-leverage work here (under **Agent mission**), using **Founder context** and **Node artifacts**, after separating real constraints from assumptions and inertia.
_Avoid_: Busywork, unfalsified "blockers," optimizing metrics unrelated to the stated goal

**North Star**:
The long-horizon anchor beyond PMF (vision of the company or product at scale); the **Grid** graph may extend past PMF toward it, distinct from **Agent mission** and from the PMF verdict itself.
_Avoid_: Collapsing **North Star**, PMF, **Agent mission**, and weekly **Pitwall** focus into one undifferentiated "goal"

**Feature tour**:
A first-run multi-step product tour shown **after sign-in** and **before** the **Project** shell. Centered modal with progress (step dots), **Back**, and **Next** only on first run—**no Skip**. **Second-to-last step:** **Founder API Key** input (account-scoped, stored on **Founder account**). **V1:** key is **required** on this step—**Next** is disabled until a live provider check succeeds. Validation must distinguish invalid credentials from transient provider/network failures and keep the Founder on the step until a successful check/save. **Post-v1:** whether the tour may allow deferring the key is **TBD**. **Last step:** startup display name + create first **Project**. Optional later **what's new** tours may include **Skip**; first-run tour does not. The **Founder** cannot reach **Pitwall** without completing the last step. The tour runs **once per Founder account**; later **Projects** are created via the **Project switcher**, not by re-running the full tour.
_Avoid_: **Skip** on first-run tour; optional API key on tour in v1; implicit untitled **Project** on login; re-showing the full first-run tour on every new **Project**

**ONBOARDING.md**:
OpenClaw-style **boot file** seeded into the **active Project** workspace when the **Project** is created. On first **Journey Brain** runs, the agent follows **`ONBOARDING.md`** (read via Deep Agents file tools and/or first-turn prompt injection—implementation **TBD**) to run a short conversational ritual and write **Founder context** into durable workspace files. When the **Journey Brain** judges it has sufficient **Founder context**, the **agent** removes or archives **`ONBOARDING.md`** via workspace file tools so the ritual does not repeat (OpenClaw `BOOTSTRAP.md` pattern; **grill Q8: A**). Ritual copy and sufficiency criteria live in **`ONBOARDING.md`** + **configure system prompt**—**not** in `CONTEXT.md`. Repo template path for seeding **`ONBOARDING.md`** at **Project** create is **TBD** (**grill Q9**). Platform may add a safety check later if needed.
_Avoid_: A separate onboarding agent or page; hard-coded multi-step forms; platform-only deletion before the agent marks sufficiency; keeping **`ONBOARDING.md`** forever after completion

**Conversational onboarding**:
Post–**feature tour** dialogue in **Pitwall composer state** for the new **Project**, driven by **`ONBOARDING.md`** and the **same** **Journey Brain** as post-onboarding work (center composer + ChatGPT-style thread)—not a second harness. **Founder API Key** is on the tour **second-to-last step** (first account run). When onboarding completes per **`ONBOARDING.md`** rules, **`ONBOARDING.md`** is removed/archived and **Pitwall** becomes **Pitwall operational state**. **Interview practice Sessions** do **not** substitute for finishing onboarding (**grill Q18**). Additional **Projects** skip the tour and land in **Pitwall composer state** with a fresh **`ONBOARDING.md`**. 
_Avoid_: Lesson-style forms; operational dashboard before **`ONBOARDING.md`** ritual completes; **Session** reports unlocking operational **Pitwall** early

**Session**:
A complete spoken **practice** interview in the **Interview practice Node** with a virtual **Customer Persona**, hidden truth, conversational turns, and a **Session Report**—simulator only, **not** a real customer interview.
_Avoid_: Scenario, case; using **Session** for real customer interview capture in the future **Customer interview Node**

**Trap**:
A conversational moment that may lure the user into weak discovery behavior, such as pitching, accepting compliments, asking hypotheticals, or failing to dig into concrete past behavior.
_Avoid_: Googly, trick

**Customer Persona**:
The simulated interview counterpart representing a plausible real customer with context, constraints, past behavior, and social incentives.
_Avoid_: AI character, bot

**Ideal Customer Profile**:
One of the user's optional account-level descriptions of the kind of customers they want to practice interviewing.
_Avoid_: Audience, segment, society

**Active Ideal Customer Profile**:
The selected Ideal Customer Profile currently used to shape future generated Customer Personas.
_Avoid_: Session setup choice, one-off persona source

**Auto-Generated Persona**:
A Customer Persona created by the simulator either randomly or within the user's Ideal Customer Profile.
_Avoid_: Artificial society, panel

**Broad Practice Pool**:
The default set of realistic customer contexts used when the Learner has no Active Ideal Customer Profile.
_Avoid_: Arbitrary random people, joke persona

**Profile Settings**:
The **Project**-scoped area inside the **Interview practice Node** where a **Founder** may create, edit, and select **Ideal Customer Profiles** for practice **Sessions** only. **Routing (v1):** under the **Interview practice** route (for example `/projects/[projectSlug]/nodes/interview-practice/settings`). **Journey Brain** still sees this via the **Interview practice** **plugin** (**Node Skill**, **Node Workspace**, **Node artifacts**). **Customer interview Node** will own different settings/artifacts when built—**TBD**.
_Avoid_: Account-wide ICP lists; putting practice ICPs on a future **Customer interview** **Node**; conflating the two **Nodes**

**Progression**:
The **Founder**'s accumulated customer interview skill level **for the active Project**, inferred from **Session Report** quality and enough completed-session evidence in that venture.
_Avoid_: One global skill track across unrelated **Projects**; manual difficulty setting, course level

**Achievement Node**:
A milestone on the Progression path unlocked by meaningful practice accomplishments.
_Avoid_: Badge spam, lesson completion

**Global Ranking**:
The user's percentile position relative to other users' measured customer interview skill.
_Avoid_: Leaderboard score, vanity rank

**Insufficient Data State**:
The Global Ranking state shown when there is not enough user or population evidence to produce a credible percentile.
_Avoid_: Placeholder rank, fake percentile

**Start Practice**:
The action that immediately begins a new **Session** in the **Interview practice Node** without a pre-session configuration screen. **V1:** available even during **Pitwall composer state** (onboarding chat in progress)—**Interview practice** is **unlocked at Project boot**; **Journey Brain** may nudge "finish context first" but does **not** hard-block **Start Practice**.
_Avoid_: Configure session, create scenario; gating practice on **Pitwall operational state**

**Practice Dashboard**:
The chrome inside the **Interview practice Node**'s **Active Node surface** (for example **Start Practice**, **Progression**, **Global Ranking**, recent **Session Reports**)—**not** the global **Pitwall** module and **not** the future **Customer interview Node**.
_Avoid_: Course page, productivity dashboard, lesson plan; treating **Practice Dashboard** as global **Pitwall**; using it for real customer interview workflows

**Learner**:
The **Founder** while using the voice **Session** **Node**: the individual practicing customer interview skill in the simulator.
_Avoid_: Team, coach, organization

**Landing Page**:
The public marketing page that explains the product and sends users to sign up or log in.
_Avoid_: Onboarding, lesson intro

**Product display name**:
The user-visible product label shown in React UI: `ApexPMF`.
_Avoid_: Using the display string in provider client metadata, env defaults, or other machine-facing integration labels.

**Product app name**:
The canonical ASCII identifier `ApexPMF` (matches metadata such as document title and integration defaults).

**Product tagline**:
The short public marketing line: `Your Fastest Path to Product-Market Fit`.
_Avoid_: Using it as the HTML meta description when a fuller sentence is needed.

**Product description**:
The public value proposition: `AI agent that finds you product-market fit the fastest way possible` (landing hero promise and HTML metadata).
_Avoid_: Confusing with **Session Report** summaries or **Founder Goal** text.

**Working Product Name**:
Deprecated term; use **Product display name** and **Product app name** instead.

**Founder API Key**:
The **Founder**-supplied Gemini API credential stored on the **Founder account** (not per **Project**) so the product can run voice **Sessions**, non-live LLM flows, and **Journey Brain** calls for any **Project** under that account. **First run:** required on the **feature tour** **second-to-last step** (before **Project** creation) with live validation before proceeding. **Later:** view or update via **account menu** → **Settings**. Runtime policy is one shared gate: Gemini-dependent flows must require a valid key and return a typed domain outcome (`missing`, `invalid`, `transient failure`) so shell services can route the Founder to Settings with clear copy. Persist key handle metadata including validation status and last validated timestamp. **Post-v1:** optional/deferred key on tour **TBD**.
_Avoid_: Per-**Project** API keys in v1; optional tour key in v1; platform-billed **Credits** or subscription entitlements

**Account menu**:
Footer of the authenticated **left sidebar**: **Founder** identity (avatar, name/email), plan badge if applicable, and a settings entry that opens account-level actions (**Settings**, usage, log out). **Founder API Key** lives under this menu (for example **Settings** → API / integrations)—outside **Project** routes.
_Avoid_: Treating the footer as **Project**-scoped; duplicating account settings on every **Project** page

**Gemini provider**:
The sole external model provider for the refactor: **Google Gemini API** for both live voice (Gemini Live) and non-live structured LLM work; **OpenRouter** and other LLM routers are removed.
_Avoid_: Split-brain LLM routing (OpenRouter for batch, Gemini only for voice) after the refactor

**Free Trial Session**:
Deprecated for the refactor; superseded by **Founder API Key** gating—no platform-funded trial **Session** without a configured key unless explicitly reintroduced.
_Avoid_: Demo, sample chat (as a billing concept)

**Credits**:
Deprecated usage currency for paid **Sessions** after the refactor; remove ledgers, **Credit Exhaustion**, and subscription top-ups.
_Avoid_: Tokens, minutes (as internal billing units)

**Subscription Credits**:
Deprecated monthly included **Credits**; no subscription plan in the refactor.
_Avoid_: Unlimited plan, course membership

**Credit Exhaustion**:
Deprecated end-of-**Session** state when platform **Credits** run out; not applicable under **Founder API Key** billing.
_Avoid_: Hard cutoff, mid-call paywall (for credit depletion)

**Voice Failure**:
A technical failure in voice input, voice output, or transcription during a Session.
_Avoid_: Text fallback, silent degradation

**Audio Recording**:
Stored raw audio from a Voice Conversation.
_Avoid_: Required session artifact, default recording

**Opening Context**:
The brief natural introduction shown at the start of a Session, without revealing a full persona dossier.
_Avoid_: Persona dossier, customer brief

**Natural Conclusion**:
The simulator-led ending of a Session when the conversation has sufficiently exercised the planned practice material before the 60-minute cap.
_Avoid_: Completed all traps, quiz finished

**Hidden Evaluation**:
The simulator's internal assessment of the user's interview behavior after a Session ends.
_Avoid_: Real-time coaching, live hints

**Hidden Test Plan**:
The unrevealed set of skills, traps, and persona dynamics the simulator may evaluate in a Session.
_Avoid_: Pre-session objectives, visible challenge list

**Generated Session Case**:
The preserved internal record of the generated Customer Persona, hidden backstory, Customer Fit, Hidden Test Plan, Traps, transcript, evaluation, and report.
_Avoid_: User-facing dossier, exact retry seed

**Session Report**:
The post-session feedback that summarizes what happened, where the user failed, and what to reflect on.
_Avoid_: Live feedback, transcript notes

**Report Generating State**:
The short post-session waiting state while the Session Report is produced.
_Avoid_: Redirect that hides **Report Generating State** behind unrelated chrome

**Trap Result**:
The post-session assessment of whether the user fell for, avoided, or partially handled a Trap.
_Avoid_: Live trap status, trap counter

**Session Transcript**:
The transcribed conversation record available after a Session for reviewing evidence behind the Session Report.
_Avoid_: Main report, live notes

**Expandable Evidence**:
Transcript excerpts that can be expanded from Session Report comments.
_Avoid_: Deep links, transcript navigation

**Voice Conversation**:
The live spoken interaction between the user and the Customer Persona during a Session.
_Avoid_: Text chat, written interview

**Conversational Friction**:
Natural voice behavior such as hesitation, rambling, vague answers, mild discomfort, interruption, and questions back to the user.
_Avoid_: Chaos, perfect turn-taking

**Interview Behavior**:
The user's question quality and basic conversational conduct during a Voice Conversation.
_Avoid_: Vocal polish, charisma score

**Concrete History**:
Specific past behavior, paid attempts, recent events, constraints, and decisions from the Customer Persona's backstory.
_Avoid_: Opinion, future intent

**Learning Signal**:
Useful truth the user extracts about customer behavior, pain, workarounds, willingness to pay, decision process, or non-customer fit.
_Avoid_: Validation, yes, interest

**Customer Fit**:
The hidden degree to which a Customer Persona plausibly belongs to the Ideal Customer Profile and has a problem worth discovering.
_Avoid_: Qualified lead, prospect score

**Session Timer**:
The visible elapsed-time indicator shown during a Session.
_Avoid_: Progress bar, trap counter

## Relationships

- A **Founder account** owns zero or more **Projects**; the **shell** always runs in one **active Project**. **Founder API Key** is account-scoped; **Pitwall**, **Grid**, **Sessions**, **Node Workspaces**, and **Founder context** are **Project**-scoped.
- **Project switcher** lives in the **Pitwall** top bar (Vercel-style); v1 sidebar inside a **Project** is **Pitwall** and **Grid** only.
- **Authenticated shell** (v1): **left** nav (**Pitwall**, **Grid**, optional **Pinned Nodes**), **footer** **account menu**; **center** canvas = **Pitwall composer state**, **Pitwall operational state**, **Grid**, or **Active Node surface**; **right** **Agent chat rail** on **Grid**, **Pitwall operational state**, and **Active Node surfaces**—**not** on **Pitwall composer state**.
- **Grid** is reachable during **Pitwall composer state**; **Journey Brain** may nudge completing onboarding first, then nudge toward **Nodes** after onboarding. **V1 Grid:** **only** shipped **Interview practice** (**unlocked at boot**). **Later:** full catalog visible; each **Node** has **locked** / **unlocked** state (no `pre-journey` code category).
- **Grid** defaults to the graph map; selecting an **unlocked** **Node** opens its **Active Node surface** (fully interactive). Baseline return-to-map: compact **back** (for example `<`). Sidebar: **Pitwall**, **Grid**, optional **Pinned Nodes** (**not finalized**).
- **First-run path:** sign up / log in → **feature tour** (… → **Founder API Key** → create **Project**) → seed **`ONBOARDING.md`** in **Project** workspace → `/projects/[projectSlug]/pitwall` **Pitwall composer state** → **`ONBOARDING.md`** ritual completes → remove/archive **`ONBOARDING.md`** → **Pitwall operational state** → **Grid** / **Interview practice** / **Session** (practice may happen during composer—**not** a substitute for finishing onboarding).
- **Additional Project:** **Project switcher** inline create → new slug → fresh **`ONBOARDING.md`** + **Pitwall composer state** for that startup.
- **V1** ships a real **Pitwall** and a **Grid** with one **Node** (**Interview practice** simulator only); **Customer interview Node** is **future** **TBD**. The **Interview practice** **Active Node surface** is not read-only. **Journey Brain** ships as a **deepagentsjs** harness with workspace file tools and **Node Skills**; **Pitwall** includes agent chat (direction **B**). Not a full multi-channel OpenClaw clone (no Telegram/bash marketplace day one). Open product choices may stay unresolved until the implementing issue; this file tracks **defaults and resolved forks** only.
- The product promise pairs the **prebuilt** PMF **Node** graph with **operating intelligence**: improving the **Founder**'s system (constraints, bottlenecks, pace of validated learning), not only sequencing tools toward PMF.
- **Node catalog** and **Journey milestone** spine are **TBD**—owned by `platform/registry` when built; informed by first-principles PMF work and references such as [Christian Strunk PMF](https://www.christianstrunk.com/blog/product-market-fit) / [PMF framework](https://www.christianstrunk.com/blog/pmf-framework), not copied wholesale. The former `knowledge-graph/` folder was **removed**; do not reference it in new docs or code.
- **Coding-agent analogy:** short session (minutes–hours) using plugins (Supabase, Vercel, …) to finish a task; ApexPMF **Journey Brain** uses **Node** **plugins** over a **long horizon** (months to PMF) with **Journey milestone** replanning—not one plan for the entire trip.
- **Interview practice** is the first shipped **Node** on the **Grid** (voice **Session** with **Customer Persona**). Later **Nodes** include **Customer interview** (real interviews—**TBD**) and others (ICP-to-lead, synthesis, etc.).
- **Platform store** (database) holds structured product truth per **Project** (and account-level **Founder API Key** handles); each **Node** **plugin** has a **Node Workspace** (files) under that **Project** for the **Journey Brain**; **sync** consolidated summaries from database into **Node Workspace** after milestones.
- **Node Workspace** content is private per **Project** per **Node**; **Platform store** holds what the web app queries directly (sessions, reports, progression scoped to **Project**).
- The **Journey Brain** operates under **Agent mission** (**configure system prompt**); it uses **Founder context**, validated **Bottleneck**, and **Node artifacts** as steering inputs—not a founder-written **Founder Goal** document.
- **Journey Brain** is one meta-agent across **Nodes**; each **Node** is a **plugin** (Codex-style) with **Node Runtime**, **Node Skill**, and **Node Workspace**; the brain consumes consolidated **Node artifacts** (database + synced files), not necessarily all raw data on every turn.
- V1 includes **Landing Page**, authentication, **Pitwall**, **Grid** (**Interview practice Node** only), that **Node**'s **Active Node surface** with **Practice Dashboard** chrome (**Start Practice**, **Profile Settings** and **Ideal Customer Profiles** per **Project**, **Voice Conversation**, **Report Generating State**, **Session Report**, **Progression**, **Achievement Nodes**, **Insufficient Data State**), account-level **Founder API Key** configuration, **Gemini provider**, plus **Journey Brain** and **Node Workspaces**—all under **Project routes**, not legacy top-level shell routes
- V1 **excludes** platform **Credits**, **Free Trial Session**, subscription billing, **Credit Exhaustion**, and all credit-ledger code paths
- V1 excludes teams, coaches, exact retry, text chat mode for **Sessions** (voice-first interview **Node**), default **Audio Recording**, showing next practice focus outside the **Session Report**, past-weakness personalization, public report sharing, and lesson-style form onboarding
- V1 includes **conversational onboarding** via **`ONBOARDING.md`** at **Project** boot (same **Journey Brain**) and **Agent mission** (**configure system prompt**, not founder-authored)
- A **Session** contains zero or more **Traps**
- A **Trap** appears inside the conversation flow and is evaluated after the **Session**, not explained during it
- A **Session** has exactly one **Customer Persona**
- A **Session** is a **Voice Conversation**, not a text chat
- A **Voice Conversation** includes **Conversational Friction** while remaining coherent enough to evaluate
- **Hidden Evaluation** assesses **Interview Behavior**, including question quality and basic conversational conduct
- In v1, **Hidden Evaluation** does not score accent, vocal polish, charisma, or sounding confident
- **Profile Settings** (per **Project**) may contain multiple **Ideal Customer Profiles** for that startup
- At most one **Ideal Customer Profile** is the **Active Ideal Customer Profile**
- One **Ideal Customer Profile** can produce many different **Customer Personas**
- A **Session** selects one generated **Customer Persona**, either randomly or shaped by the user's **Active Ideal Customer Profile**
- Without an **Active Ideal Customer Profile**, **Customer Personas** come from the **Broad Practice Pool**
- Editing or switching the **Active Ideal Customer Profile** affects future **Sessions**, not past **Generated Session Cases** or reports
- Startup idea context for a venture lives on the **Project** (**Founder context**); the interview **Node** does not require a separate startup-idea form at **Session** start in v1
- A **Session** may end before 60 minutes, but never exceeds 60 minutes
- V1 is single-player: one **Learner** per **Project** owns that **Project**'s **Progression**, **Global Ranking**, reports, and **Ideal Customer Profiles**; **Founder API Key** is account-level
- V1 does not support teams, coaches, organization accounts, or shared report review
- **Session Reports** and **Session Transcripts** are private to the **Learner** by default
- V1 does not support public report links, social feeds, or report sharing
- A **Learner** can delete reports and account data
- V1 does not store **Audio Recording** by default
- **Session Transcripts**, evaluation artifacts, and reports are the default post-session records
- **Start Practice** immediately begins a **Session** with no pre-session configuration screen
- The interview **Active Node surface** centers **Start Practice**, **Progression**, **Global Ranking** or **Insufficient Data State**, and recent **Session Reports**
- The interview **Active Node surface** should not center tasks, modules, lessons, checklists, or calendars
- In v1, the interview **Active Node surface** should not show next practice focus; the **Session Report** owns that feedback
- The **Landing Page** is outside the authenticated practice loop and routes users to sign up or log in
- The **Landing Page** uses the **Product display name** in visible chrome and the **Product app name** in HTML metadata; it does not require an on-page Mom Test affiliation disclaimer
- The product should not falsely claim to be an official Mom Test book product, a licensed product, or an endorsed product
- Landing-page supporting copy is not resolved yet
- After sign up or log in, a **Founder** with no **Projects** completes the first-run **feature tour** (**Back** / **Next** only; **second-to-last** **Founder API Key**; **last** names startup and creates **Project**). **Founders** with **Projects** land on `/projects/[projectSlug]/pitwall` (**composer** or **operational** by **Project** data). **Conversational onboarding** is **Pitwall composer state**; **Pitwall operational state** follows **finished** onboarding chat only—not **Session** completion
- A user may define an **Ideal Customer Profile** from **Profile Settings** under the **Interview practice Node** (for example `…/nodes/interview-practice/settings`); **Journey Brain** sees **Interview practice** plugin context via **Node Skill**, **Node Workspace**, and **Node artifacts**—separate from the future **Customer interview Node**
- **Start Practice** requires a configured **Founder API Key** (from feature tour or **account menu**); platform does not run **Sessions** without it. **Start Practice** does **not** require **Pitwall operational state**—**Interview practice** (**unlocked at boot**) may run during composer onboarding
- There is no subscription, in-app pricing, or platform **Credits** ledger in the refactor
- A **Voice Conversation** should not show in-session purchase or billing modals
- **Voice Failure** should pause, resume if possible, or end gracefully without switching to text chat
- A partial **Session Report** should only be generated after **Voice Failure** when there is enough evidence
- A **Session** begins with **Opening Context**, not a detailed **Customer Persona** dossier
- A **Session** can end by user quit, **Natural Conclusion**, or the 60-minute cap
- A **Natural Conclusion** does not reveal how many **Traps** were planned or encountered
- The **Hidden Test Plan** is not revealed before or during a **Session**
- The **Session Report** may reveal what the **Hidden Test Plan** evaluated after the **Session**
- A **Generated Session Case** is preserved internally for audit and report quality
- A **Generated Session Case** is not exposed to the user as a full hidden backstory by default
- **Hidden Evaluation** runs after a **Session** ends using the **Session Transcript**, without interrupting the conversation
- **Hidden Evaluation** uses both the **Session Transcript** and internal **Generated Session Case** context (including hidden mechanics) to produce evaluation artifacts
- A **Session Report** is generated after a **Session** ends
- After a **Session** ends, the user sees the **Report Generating State** and then the **Session Report** directly
- Coaching appears in the **Session Report**, not during the **Session**
- A **Session Report** includes outcome, missed signals, bad questions, strong questions, **Trap Results**, skill movement, and next practice focus
- **Trap Results** are revealed only after the **Session** ends
- A **Session Report** shows the **Active Ideal Customer Profile** or **Broad Practice Pool** used, plus a light persona label
- A **Session Report** does not expose the full hidden backstory by default
- A **Session Transcript** is available after the **Session**, but the **Session Report** is the primary feedback surface
- In v1, a **Session Report** may show **Expandable Evidence** from the **Session Transcript** instead of transcript links
- A **Session** cannot be retried exactly
- Practicing again from the same **Ideal Customer Profile** creates a new **Session** with a different **Customer Persona**
- A **Customer Persona** may give unreliable social signals but should answer truthfully when asked about **Concrete History**
- A **Customer Persona** should not maliciously invent false **Concrete History**
- A successful **Session** produces **Learning Signal**, not agreement or praise
- Discovering that a **Customer Persona** is not a real customer can be a high-quality **Learning Signal**
- Sessions should include diverse **Customer Fit**, including strong-fit, weak-fit, bad-fit, buyer/user mismatch, and influencer personas
- During a **Session**, the user may see a **Session Timer** and end control
- During a **Session**, the user should not see score, **Progression**, **Global Ranking**, **Trap** count, or evaluative hints
- **Progression** increases through a mix of completed-session volume and **Session Report** quality
- A single high-quality **Session** should not automatically produce elite **Progression**
- **Progression** is visualized as a path with **Achievement Nodes**, not only a plain bar
- **Achievement Nodes** should primarily reward skill milestones, with volume rewarded only when paired with quality
- Completing the first meaningful **Session** after **Founder API Key** setup unlocks the first **Achievement Node** and contributes lightly to **Progression**
- **Global Ranking** is derived from **Progression**, not chosen by the user
- The first **Session** alone should not unlock **Global Ranking**
- **Global Ranking** should show an **Insufficient Data State** until there is enough evidence
- **Global Ranking** should use percentile bands, not exact leaderboard positions
- In v1, past report weaknesses do not shape future **Sessions**

## Example dialogue

> **Dev:** "Should every persona response be a Trap?"
> **Domain expert:** "No — a **Session** should feel like one natural interview. A **Trap** is only a possible test inside that conversation."
> **Dev:** "What is the v1 product loop?"
> **Domain expert:** "Landing, auth, **Pitwall**, **Grid** with the interview **Node**, optional ICP settings, voice practice inside that **Node**, report, credits, progression, and ranking placeholder. Leave collaboration, lessons, text fallback, exact retry, and personalization out."
> **Dev:** "Are we simulating a whole market?"
> **Domain expert:** "No — the product may create an **Auto-Generated Persona**, but the user practices one interview with one **Customer Persona** at a time."
> **Dev:** "Should the user enter the idea they are testing?"
> **Domain expert:** "No — **Profile Settings** may contain **Ideal Customer Profiles**, but the simulator does not ask for a pitch."
> **Dev:** "Could we keep the idea hidden from the persona but visible to the evaluator?"
> **Domain expert:** "No — v1 should not collect startup idea input at all."
> **Dev:** "Does the user pick beginner, standard, or brutal?"
> **Domain expert:** "No — **Progression** starts at beginner and the simulator increases difficulty as the user improves."
> **Dev:** "What happens when the user presses start?"
> **Domain expert:** "**Start Practice** immediately begins the **Session**. The user may see a short **Opening Context**, but not a setup screen or persona dossier."
> **Dev:** "Is the home screen a course?"
> **Domain expert:** "No — **Pitwall** is the default home; the interview **Active Node surface** is centered on starting another practice loop and reviewing progress."
> **Dev:** "Can coaches or teams review reports in v1?"
> **Domain expert:** "No — v1 is for one **Learner** improving their own interview skill."
> **Dev:** "Can users share reports publicly?"
> **Domain expert:** "No — **Session Reports** and **Session Transcripts** are private to the **Learner** in v1."
> **Dev:** "Do we store the actual call audio?"
> **Domain expert:** "No — v1 does not store **Audio Recording** by default; the durable artifacts are transcript, evaluation, and report data."
> **Dev:** "Should the dashboard show next practice focus?"
> **Domain expert:** "No for v1 — the **Session Report** owns next practice focus to keep the interview **Active Node surface** simple."
> **Dev:** "Does the authenticated app repeat the landing-page promise?"
> **Domain expert:** "No — the **Landing Page** handles marketing. After sign up or log in, the user goes to **Pitwall**."
> **Dev:** "Is this an official Mom Test book product?"
> **Domain expert:** "No — use **Product display name** / **Product app name** for ApexPMF, and do not claim official Mom Test licensing or endorsement."
> **Dev:** "How does the user try the product?"
> **Domain expert:** "Configure a **Founder API Key** before **Start Practice**; there is no platform **Free Trial Session** or **Credits** in the refactor."
> **Dev:** "Does every paid **Session** cost the same?"
> **Domain expert:** "N/A — usage bills to the **Founder**'s Gemini API account, not ApexPMF **Credits**."
> **Dev:** "What happens if the API quota runs out during a call?"
> **Domain expert:** "Treat like provider failure—graceful **Voice Failure** or clear key/quota error; no **Credit Exhaustion** paywall."
> **Dev:** "Should voice failure fall back to text chat?"
> **Domain expert:** "No — **Voice Failure** should pause, resume if possible, or end gracefully; billing is on the **Founder**'s Gemini account via **Founder API Key**, not platform **Credits**."
> **Dev:** "Does every **Session** run for the full hour?"
> **Domain expert:** "No — 60 minutes is only the cap. The simulator can reach a **Natural Conclusion** earlier if the conversation has done enough work."
> **Dev:** "Should the simulator correct the user when they ask a bad question?"
> **Domain expert:** "No — **Hidden Evaluation** tracks it silently. The **Session Report** gives feedback after the conversation ends."
> **Dev:** "Where should the user go after ending a **Session**?"
> **Domain expert:** "Show the **Report Generating State**, then open the **Session Report** directly."
> **Dev:** "Should the user know what skill the next **Session** is testing?"
> **Domain expert:** "No — the **Hidden Test Plan** stays hidden until the **Session Report**."
> **Dev:** "Should we preserve what the simulator generated?"
> **Domain expert:** "Yes — keep the **Generated Session Case** internally for audit and report quality, but do not expose the full hidden backstory by default."
> **Dev:** "Can the persona lie?"
> **Domain expert:** "The persona can be polite, vague, or speculative, but should answer truthfully when asked for **Concrete History**."
> **Dev:** "Is it a failed **Session** if the user finds out the persona is not a customer?"
> **Domain expert:** "No — that can be excellent **Learning Signal** if the user discovered it through good questions."
> **Dev:** "Should every generated persona secretly be a good customer?"
> **Domain expert:** "No — **Customer Fit** should vary so users practice identifying strong-fit and bad-fit people."
> **Dev:** "Should the user see progress or score while interviewing?"
> **Domain expert:** "No — only a **Session Timer** and end control. Evaluative feedback waits until the **Session Report**."
> **Dev:** "Can one excellent **Session** make the user top 1%?"
> **Domain expert:** "No — **Progression** needs both quality and enough evidence across completed **Sessions**."
> **Dev:** "Does the free trial count?"
> **Domain expert:** "Yes — the first completed **Session** after setup generates a real **Session Report** and unlocks the first **Achievement Node**, but does not unlock **Global Ranking** by itself."
> **Dev:** "Should achievements reward streaks and raw usage?"
> **Domain expert:** "No — **Achievement Nodes** should mainly reward better interview skill, not shallow activity."
> **Dev:** "What should ranking show before it is credible?"
> **Domain expert:** "Use an **Insufficient Data State**, then show percentile bands when there is enough evidence."
> **Dev:** "Can we show which traps happened?"
> **Domain expert:** "Yes, but only as **Trap Results** inside the **Session Report**, not during the interview."
> **Dev:** "Should old reports show what ICP/persona they used?"
> **Domain expert:** "Yes — show the **Active Ideal Customer Profile** or **Broad Practice Pool** and a light persona label, not the hidden backstory."
> **Dev:** "Should we show the transcript?"
> **Domain expert:** "Yes, but the **Session Report** comes first and uses simple **Expandable Evidence** instead of deep transcript links in v1."
> **Dev:** "Can the user retry the exact same **Session**?"
> **Domain expert:** "No — they can practice again from the same **Ideal Customer Profile**, but the next **Session** should use a different **Customer Persona**."
> **Dev:** "Can users change ICPs?"
> **Domain expert:** "Yes — they can create multiple **Ideal Customer Profiles** and choose an **Active Ideal Customer Profile** for future **Sessions**."
> **Dev:** "What happens with no active ICP?"
> **Domain expert:** "The simulator uses the **Broad Practice Pool**, not arbitrary random people."
> **Dev:** "Is v1 text-based?"
> **Domain expert:** "No — the **Session** is a **Voice Conversation**. Text artifacts exist after the conversation for reporting and evidence."
> **Dev:** "Should the persona always answer cleanly?"
> **Domain expert:** "No — **Conversational Friction** is part of the practice, as long as the interview stays coherent."
> **Dev:** "Are we only grading question wording?"
> **Domain expert:** "No — **Interview Behavior** includes question quality and basic conversational conduct, but not vocal polish."

## Flagged ambiguities

- **Node catalog vs agent intelligence** (grill): resolved — **Node catalog** + **Node Skill** are **product-owned**; per-**Node** **locked** / **unlocked** state in code; **Journey Brain** is **intelligent** (unlock, nudges, **Journey milestone** replanning, progressive skill load). Analogous to Codex plugins on a **long-horizon** PMF journey.
- **Pre-journey in code** (grill): resolved — **conversational label only** for **Nodes** **unlocked at Project boot**; **not** a software category or enum.
- **Operational Pitwall gate** (grill Q18): resolved — **no** early flip from **Sessions**; onboarding chat must **finish** (required context in agent onboarding **system prompt** only).
- **Journey milestone spine** (grill Q13): **TBD** — PMF-canvas-style direction (similar to Strunk five components) but redesigned from first principles; catalog lives in **`platform/registry`**, not `knowledge-graph/` (deleted).
- **V1 Grid map** (grill Q14): resolved — **only** shipped **Nodes** on the map (**Interview practice**); **no** skeleton of locked future **Nodes** until catalog spine exists.
- **Profile Settings routing** (grill Q15): resolved — under **Interview practice Node** routes; **Journey Brain** retains plugin context (not a silo).
- **Interview practice vs Customer interview** (grill): resolved — **two different Nodes**; v1 = **Interview practice** (Mom Test simulator) only; **Customer interview** (real interviews) = **future** **TBD**—do not conflate in copy, routes, or catalog.
- **Agent chat rail on Grid** (grill Q16): resolved — **yes** in v1 (alongside operational **Pitwall** and **Interview practice Active Node surface**); **no** rail on **Pitwall composer state**.
- **Start Practice during onboarding** (grill Q17): resolved — **yes**; **Interview practice** (**unlocked at boot**) is not gated on **Pitwall operational state**; soft nudges only.

- **V1** slice (Q14): resolved — **integrated copilot loop** (not shell-only): **real Pitwall** after at least one **Session**; **Grid** with **one** interview **Node**; fully interactive **Active Node surface**; **Journey Brain** via **deepagentsjs** OpenClaw/Hermes-shaped harness (workspace + file tools + **Node Skills**), not full external-channel clone day one. Defer **Pinned Node** auto-workset and **Node work state** until baseline loop works.
- **Pitwall agent UX** (grill): direction **B** — **Journey Brain** chat via persistent **Agent chat rail** on authenticated windows (Cursor-for-PMF pattern) plus generative operational UI in **Pitwall**; **no** multi-channel (Telegram, etc.), bash/browser marketplace, or “interview as meta-agent chat” in v1.
- **Founder Goal** (grill): **not** founder-authored — use **Agent mission** (**configure system prompt**, content not specified here) + **Founder context** (basics, schema **TBD**); onboarding via **`ONBOARDING.md`** at boot (OpenClaw-style).
- **Journey Brain** (grill, Deep Agents): **one** `createDeepAgent` per **Project**—**not** a separate onboarding agent; composer vs operational is UI + whether **`ONBOARDING.md`** still exists.
- **ONBOARDING.md completion** (grill Q8): **A** — **agent** decides sufficiency and removes/archives **`ONBOARDING.md`**; then **Pitwall operational state**.
- **ONBOARDING.md template location** (grill Q9): **TBD** — decide in the first brain/onboarding issue (repo path vs skill bundle vs other).
- **Authenticated shell layout** (grill): **left** sidebar (**Pitwall**, **Grid**, optional **Pinned Nodes**) + **footer** account menu + **center** canvas + **right** **Agent chat rail** on **Grid**, **Pitwall operational state**, and **Active Node surfaces**—**not** on **Pitwall composer state** (center thread only). Rail collapse/mobile **TBD** per issue.
- **Credits** (v1): resolved — **remove entirely** from product and codebase; **Founder API Key** only.
- **Progression** (v1, grill): **keep** inside the interview **Node** **Active Node surface** (**Progression** path, **Achievement Nodes**, **Global Ranking** / **Insufficient Data State**)—not moved to **Pitwall** for v1.
- **Planning style**: vision/grill/PRD work is **alignment for founders and coding agents**, not a frozen spec—many details stay **TBD until the issue that needs them**; record decisions in `CONTEXT.md` / ADRs as they land during build.
- Product direction: **Journey Brain**, **Node Workspaces**, **Pitwall**, **Grid**, and **Nodes** are the hero scope; the voice-first **Session** practice is the first **Node**; more **Nodes** follow (for example ICP-to-leads). Many **Relationships** bullets still describe interview-**Node** behavior in detail; align copy as the shell hardens.
- **Journey Brain** implementation direction: LangChain **Deep Agents** harness (planning, virtual filesystem tools, subagents, pluggable backends, LangGraph runtime); **v1 runtime: TypeScript first** via **deepagentsjs** alongside the Next.js app; Python **deepagents** only if a concrete capability gap forces it. Production still uses **Platform store** for contracts and secrets.
- Durable **Node Workspace** bytes (v1): persist across visits; file backing via **Platform store** and/or LangGraph durable virtual FS (implementation detail); object buckets deferred unless needed.
- Hybrid storage resolved: **Platform store** = **database** for product UI and structured truth; **Node Workspace** = per-**Node** **plugin** files for the **Journey Brain**; **sync** consolidated summaries from database events into **Node Workspace** after sessions (and similar milestones).
- **Brain data diet** (Q17): resolved — **sync both**; database is source of truth for UI; **Node Workspace** holds consolidated, searchable agent context; raw data remains available when the brain needs to dig in, via search/tools, not full-context dump every turn.
- **Founder Goal** gate vs graph: superseded — **Agent mission** is product-owned; **Founder context** is conversational (**TBD** fields). **Node** catalog is **prebuilt**; brain does not spawn novel **Node** types on demand. Gate policy before expensive **Nodes** remains **TBD per issue**.
- Public promise framing (outcome vs capability language): deferred — **Founder** intent emphasizes *operational velocity* in the sense of how fast-moving builders are praised (constraint focus, iteration speed), not a narrow marketing A/B; refine honest external copy later.
- **Founder** read access to **Node Workspace**: resolved for v1 — **Founders** should be able to **read** agent-backed artifacts in **Node Workspaces**; the specific UI entry point is **undecided** and is **not** assumed to live only inside **Pitwall**; direct in-UI hand-editing is **not** committed for v1.
- **Pitwall** naming (grill): resolved — **Pitwall** is the sole canonical name for the global operational sidebar module; **Command**, **Dashboard**, and **Mission Control** are retired product terms (see deprecated entries).
- **Practice Dashboard** vs **Pitwall**: resolved — **Pitwall** is the global operational module; **Practice Dashboard** is chrome **inside** the **Interview practice Node** only—not **Customer interview Node**.
- **Pitwall** vs **Grid** (Q8): resolved for v1 — **strict separation** of primary sidebar modules; **Pitwall** = operational / bottleneck / "what now"; **Grid** = PMF **Node** map and entry into **Active Node surfaces**; link across modules, do not duplicate the full map as the main **Pitwall** canvas.
- Prerequisite / gate **skip** policy (Q9): intentionally deferred — revisit when **Pitwall**/**Grid** shell and **Node** catalog are stable.
- **Grid** → map return (Q11): baseline accepted — compact **`<`-style** control from **Active Node surface**; breadcrumbs and fuller chrome **TBD**.
- **Pinned Node** behavior (Q12): **vision in flux** — expect **Node work state** + **active workset** (often one bottleneck **Node**, sometimes two parallel) to drive which **Nodes** deserve sidebar prominence; auto-retire pins when focus moves; tie to **Pitwall** "what now"; mix of deterministic state vs agent judgment **not** chosen; coexists with **Founder**-initiated pin sketch until reconciled; cap/overflow rules revisit once auto-surfacing exists.
- **Pitwall** (global module) vs **Node**-local layouts: resolved linguistically — use **Active Node surface** for the full-panel **Node** UI opened from **Grid**; reserve **Pitwall** for the global sidebar module.
- "v1 scope" was clarified: keep the core voice practice/report/progression loop and exclude adjacent collaboration, course, sharing, personalization, and fallback surfaces.
- "googly" was used to mean a possible test inside the conversation; resolved: use **Trap**.
- "auto" was compared to artificial society products; resolved: use **Auto-Generated Persona** for a simple generated counterpart, not a simulated audience.
- "what the user brings into a Session" was too broad; resolved: the user may provide an **Ideal Customer Profile** in **Profile Settings**, not during each **Session**.
- "hidden idea context" was considered; resolved: v1 has no startup idea input, hidden or otherwise.
- "persona source" sounded like a pre-session form; resolved: **Customer Personas** are generated per **Session**, while the optional **Ideal Customer Profile** lives in **Profile Settings**.
- "ICP" was clarified: users may manage multiple **Ideal Customer Profiles** and select one **Active Ideal Customer Profile**.
- "random personas" was clarified: no active ICP uses a **Broad Practice Pool** of realistic discovery contexts.
- "difficulty" sounded user-selected; resolved: difficulty adapts from **Progression** and **Global Ranking**.
- "main screen" was clarified: default authenticated home is **Pitwall**; interview practice lives in the interview **Active Node surface** (**Practice Dashboard** chrome), not a course-style surface.
- "user" was clarified: v1 serves an individual **Learner**, not teams, coaches, or organizations.
- "report privacy" was clarified: **Session Reports** and **Session Transcripts** are private by default with no sharing in v1.
- "voice storage" was clarified: no **Audio Recording** by default in v1.
- "next practice focus" was clarified: keep it in the **Session Report**, not centered on the v1 **Pitwall** module or the interview **Active Node surface** home.
- "onboarding" was clarified: public **Landing Page** before auth; after auth, **`ONBOARDING.md`** boot ritual in **Pitwall composer state** (same **Journey Brain**)—not lesson-style forms or a second agent.
- "**Founder Goal**" was deprecated: founders do not author the agent's objective; **Agent mission** uses **configure system prompt**; founders supply **Founder context** (**TBD**).
- "product name" was clarified: **Product display name** is `ApexPMF` in UI; **Product app name** is `ApexPMF` for metadata and integrations.
- "landing copy" was clarified: **Product tagline** is `Your Fastest Path to Product-Market Fit`; **Product description** is the AI-agent PMF sentence used in hero and metadata.
- **Journey Brain** vs **Node Runtime** (interview): resolved for v1 — interview **Node Runtime** runs voice **Sessions** and existing LLM workflows; **Journey Brain** is not in the per-turn voice loop; it learns from **Node artifacts** (reports, progression, summaries) to steer journey and **Pitwall**. **TBD:** exact artifact schema per **Node**; how agentic vs HITL each **Node** becomes over time.
- **Gemini provider** (refactor): resolved — remove **OpenRouter**; use **Google Gemini API** for non-live LLM (persona generation, **Hidden Evaluation**, **Journey Brain**) and existing Gemini Live voice paths.
- **Monetization** (refactor): resolved — **bring your own API key** via **Founder API Key**; no subscription, in-app pricing, **Credits**, **Free Trial Session**, or **Credit Exhaustion** in the refactor. **V1:** one **Google AI Studio / Gemini API key** per **Founder** for all Gemini surfaces (voice + non-live LLM); **required** on feature tour penultimate step. **TBD:** key storage (encryption, rotation UI), quota/error UX when the key fails; **post-v1** whether tour may allow deferring API key.
- "voice fallback" was clarified: **Voice Failure** should not switch the **Session** to text chat.
- "previous weaknesses" was considered as an input to future session generation; resolved: keep this out of v1.
- "60 minutes" was treated as a fixed duration; resolved: it is a maximum cap, not a target length.
- "what the next Session tests" was clarified: the **Hidden Test Plan** is not shown before or during the **Session**.
- "session auditability" was clarified: preserve the **Generated Session Case** internally without making it user-facing by default.
- "feedback" was ambiguous between live coaching and after-action review; resolved: feedback belongs in the **Session Report** after the **Session**.
- "post-session navigation" was clarified: route to **Report Generating State** and then the **Session Report**, not back to the dashboard first.
- "bad data" was clarified: weak questions produce unreliable social signals, but strong questions can uncover truthful **Concrete History**.
- "success" was clarified: success means extracting **Learning Signal**, not getting compliments or agreement.
- "diverse personas" was clarified: diversity includes variation in **Customer Fit**, not just demographics or job titles.
- "in-session visibility" was clarified: the **Session Timer** may be visible, but evaluative progress stays outside the **Session**.
- "Progression" was clarified: it depends on report quality and evidence volume, not either one alone.
- "progress bar" was clarified: **Progression** should include **Achievement Nodes** along a straight path, with the first completed **Session** as the first milestone (not a platform-funded **Free Trial Session**).
- "achievements" were clarified: **Achievement Nodes** are skill-first, not badge spam for raw usage.
- "Global Ranking" was clarified: it is confidence-gated and banded, not a precise leaderboard.
- "Session Report" was clarified: it should be tied to concrete conversation moments and include **Trap Results**.
- "report context" was clarified: show ICP/source and light persona label without exposing the hidden backstory.
- "transcript" was clarified: the **Session Transcript** is supporting evidence, not the primary feedback surface; v1 uses **Expandable Evidence**, not deep links.
- "retry" was clarified: exact **Session** retry is not allowed because it trains memorization.
- "conversation" was clarified: v1 is voice-first, not text-based.
- "realistic voice behavior" was clarified: use **Conversational Friction** without making the **Session** chaotic.
- "evaluation scope" was clarified: evaluate **Interview Behavior**, not accent, charisma, or vocal polish.
