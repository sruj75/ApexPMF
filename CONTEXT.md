# ApexPMF

The authenticated ApexPMF shell for a **Founder**'s 0→1 work: a **Journey Brain** and per-**Node** **Node Workspaces** hold continuity behind the scenes. Primary sidebar modules are **Command** and **Grid**. _Informal aliases_: **Command** is also called **Dashboard** or **Mission Control** in conversation; **Grid** is also called **Playground**. Optional **Pinned Nodes** may follow. **V1** ships a **real Command** (not a placeholder), a **Grid** that shows **one** **Node** (customer interview / Mom Test simulator), and a fully interactive **Active Node surface** for that **Node** when selected (the existing voice **Session** experience)—opened from the **Grid** by normal interaction (for example click), not a read-only preview. Routing moves onto the **new backend architecture** (no legacy shell routes for this slice).

## Language

**Command**:
The primary sidebar **module** for the intelligent operational view (weekly focus, startup system status, validated **Bottleneck**, next actions), implemented with **CopilotKit** and/or **OpenUI**-style generative UI. _Informal aliases_: **Dashboard**, **Mission Control** (all three names refer to this same module).
_Avoid_: Using **Mission Control** to mean the whole authenticated app shell or the **Grid**; confusing **Command** with the interview-practice chrome inside the customer-interview **Active Node surface**; confusing it with the **Grid** canvas

**Grid**:
The sidebar **module** whose default view is the PMF **Node** graph; selecting a **Node** opens its **Active Node surface** in the main panel until the **Founder** returns to the map (baseline: compact **back** affordance such as `<`; breadcrumbs and fuller nav IA **not** finalized). _Informal alias_: **Playground** (same module).
_Avoid_: Treating **Grid** as a throwaway demo unless intentionally branded that way for founders

**Active Node surface**:
The full-width main-panel experience for one selected **Node** from the **Grid** (for example click). For the interview **Node**, this hosts the existing customer-interview / Mom Test layout (voice **Session**, progress, reports). A widget-style layout here is **not** the global **Command** module. A **Founder** may pin this **Node** from the graph or from in-surface settings so it also appears as a **Pinned Node**; a compact control (for example `<`) returns to the **Grid** map, with richer breadcrumbs later.
_Avoid_: Calling node open "drill-in" in user-facing copy if the team prefers plain language ("open the **Node**"); confusing global **Command** (or its aliases **Dashboard** / **Mission Control**) with **Node**-local layouts; confusing temporary open with a permanent sidebar slot

**Pinned Node**:
A sidebar shortcut to an **Active Node surface** for a specific **Node**, listed after **Command** and **Grid**. May be **Founder**-initiated (pin from graph or settings) and/or **system- or agent-surfaced** as part of the **active workset** when the **Journey Brain** steers the **Founder** toward current bottlenecks—exact rules **not** finalized.
_Avoid_: Treating pins as a second graph; treating sidebar clutter as acceptable without a future cap, overflow, or auto-retire story once behavior ships

**Active workset**:
The small set of **Nodes** treated as live work at once (often one bottleneck-focused **Node**, sometimes two in parallel per current vision); expected to align with **Command** "what now" and with which **Pinned Nodes** deserve prominence when auto-surfacing exists.
_Avoid_: Implying every catalog **Node** is simultaneously actionable

**Node work state**:
Where a **Node** sits in its lifecycle for a **Founder** (for example not started, in active attack, satisfied enough to move on); may combine deterministic product state and **Journey Brain** judgment—**not** finalized, but drives pathing, **Command** focus, and envisioned auto pin/unpin behavior.
_Avoid_: Pretending "done" is always a binary checkbox unless the product defines it that way

**Journey Brain**:
The single meta-agent runtime (Deep Agents–style: plan → act → observe → update) that spans the founder journey, reads and writes **Node Workspaces** across **Node** plugins, and powers **Command** and **Grid** pathing. It is **not** the in-session authority inside a **Node**'s specialist UX (for example it does not drive each voice turn in the interview **Node**); it consumes **Node artifacts** and **Learning signals** to steer the journey.
_Avoid_: A second brain per **Node**; treating **Journey Brain** as a replacement for **Node Runtime** logic

**Node Runtime**:
The product-owned logic inside a **Node**'s **Active Node surface** (workflows, UI, policies)—for example persona generation, voice **Session**, **Hidden Evaluation**, **Session Report** in the interview **Node**. May be traditional SaaS (human does the work), agent-led, or human-in-the-loop; the **Journey Brain** observes and connects, it does not reimplement **Node Runtime** rules in v1.
_Avoid_: Calling **Node Runtime** "the agent" when we mean **Journey Brain**

**Node Skill**:
A packaged instruction and capability bundle for a **Node**'s **Node Workspace** (analogous to `SKILL.md`): what the **Journey Brain** may do there, which tools or infrastructure apply (file tools, browser, scaffolding actions), and how to collaborate with the **Founder**. **Node Skills** are declared per **Node** type, not invented ad hoc per session.
_Avoid_: One global skill file for the entire product with no per-**Node** boundaries

**Node artifact**:
Structured output written after **Node Runtime** work: canonical rows live in the **Platform store** (database) for product UI; **consolidated** summaries and agent-ready files are **synced** into that **Node**'s **Node Workspace** so the **Journey Brain** can search and use them without loading all raw data every time.
_Avoid_: Only database with no **Node Workspace** sync; dumping raw transcripts into **Node Workspace** with no consolidation step

**Node**:
A **prebuilt** unit on the **Grid**: a **plugin** the **Journey Brain** can attach to (like Codex plugins for GitHub or Supabase)—each **Node** has its own **Node Workspace**, **Node Skill**, and **Node Runtime**. The **Node Runtime** runs the specialist product (for example voice **Session** practice); the **Journey Brain** connects the journey across **Nodes** but is not the in-session authority in v1 interview practice. **V1** ships one **Node** on the **Grid**; more **Nodes** follow. In product language: **each node in the grid is its own workspace**—a distinct **Node Workspace** namespace while one **Journey Brain** spans the journey.
_Avoid_: "Random widget," implying every **Node** is generated from scratch at runtime without product review; collapsing all **Nodes** into one undifferentiated file pile

**Node Workspace**:
The agent-facing file tree for one **Node** **plugin** (markdown and other paths the **Journey Brain** can read, search, and write via Deep Agents file tools). Holds consolidated summaries and agent-durable context—not necessarily every raw database row. The **Journey Brain** uses **Node Workspace** when operating in that **Node**; it does not need to ingest all raw product data on every turn.
_Avoid_: Calling **Node Workspace** "the database"; expecting the brain to load unconsolidated raw telemetry by default

**Platform store**:
The **database** (for example Postgres via Supabase): source of truth for traditional web-app state—auth, **Founder API Key** handles, structured **Session** rows, **Session Report** JSON, progression, and other product UI data. After meaningful **Node Runtime** events, consolidated summaries are **synced** into the matching **Node Workspace** so **Command** and the **Journey Brain** share one story without duplicating authority.
_Avoid_: Using "platform store" when you mean **Node Workspace** files; storing **Founder API Key** secrets only in markdown files

**Founder**:
The individual building toward PMF inside the product; may use multiple **Nodes**, including voice **Sessions**.
_Avoid_: Anonymous "user" when we mean the account owner on a 0→1 journey

**Founder Goal**:
The founder-authored statement of what the 0→1 system is optimizing for; the **Journey Brain** aligns **Nodes** and **Node Workspace** work to it and should surface conflicts instead of silently overriding it.
_Avoid_: Goals implied only in chat with no durable artifact

**Bottleneck**:
The tightest validated limit on progress toward the **Founder Goal**; the **Journey Brain** prioritizes high-leverage work here after separating real constraints from assumptions, institutional inertia, and non-constraints (per first-principles / systems thinking, not celebrity cargo-cult).
_Avoid_: Busywork, unfalsified "blockers," optimizing metrics unrelated to the stated goal

**North Star**:
The long-horizon anchor beyond PMF (vision of the company or product at scale); the **Grid** graph may extend past PMF toward it, distinct from the current arc's **Founder Goal** and from the PMF verdict itself.
_Avoid_: Collapsing **North Star**, PMF, and weekly **Command** (or **Dashboard** / **Mission Control**) focus into one undifferentiated "goal"

**Session**:
A complete spoken practice interview case with a virtual persona, customer context, hidden truth, conversational turns, and a final report.
_Avoid_: Scenario, case

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
The account-level area where a user may create, edit, and select Ideal Customer Profiles.
_Avoid_: Session setup, pre-session form

**Progression**:
The user's accumulated customer interview skill level inferred from both Session Report quality and enough completed-session evidence.
_Avoid_: Manual difficulty setting, course level

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
The action that immediately begins a new Session without a pre-session configuration screen.
_Avoid_: Configure session, create scenario

**Practice Dashboard**:
The interview-practice chrome inside the customer-interview **Node**'s **Active Node surface** (for example **Start Practice**, **Progression**, **Global Ranking**, recent **Session Reports**)—**not** the global **Command** module.
_Avoid_: Course page, productivity dashboard, lesson plan; treating **Practice Dashboard** as the top-level authenticated home after the **Command**/**Grid** shell exists (that home is **Command** / **Dashboard** / **Mission Control**, not interview chrome)

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
The short public marketing line: `Speedrun Product-Market Fit`.
_Avoid_: Using it as the HTML meta description when a fuller sentence is needed.

**Product description**:
The public value proposition: `AI agent that finds you product-market fit the fastest way possible` (landing hero promise and HTML metadata).
_Avoid_: Confusing with **Session Report** summaries or **Founder Goal** text.

**Working Product Name**:
Deprecated term; use **Product display name** and **Product app name** instead.

**Founder API Key**:
The **Founder**-supplied Gemini API credential stored for their account so the product can run voice **Sessions**, non-live LLM flows (persona generation, **Hidden Evaluation**, **Journey Brain**), and related calls on their behalf.
_Avoid_: Platform-billed **Credits**, subscription entitlements, or implying ApexPMF pays model providers in the refactor

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

- **Grid** defaults to the graph map; **v1** shows one **Node**; selecting it opens its **Active Node surface** (fully interactive). Baseline return-to-map control is a compact **back** affordance (for example `<`); richer breadcrumbs and IA **TBD**. The sidebar lists **Command** and **Grid** first, then **Pinned Nodes**—**Founder**-initiated and/or future auto-surfaced entries for the **active workset** (**not finalized**).
- **V1** ships a real **Command** and a **Grid** with one **Node** (customer interview / Mom Test simulator); the interview **Active Node surface** is not read-only. **Journey Brain** and **Node Workspaces** are implemented to the extent the **rebuilt backend** requires for that slice (not “wire everything” for a hypothetical multi-node day one).
- The product promise pairs the **prebuilt** PMF **Node** graph with **operating intelligence**: improving the **Founder**'s system (constraints, bottlenecks, pace of validated learning), not only sequencing tools toward PMF.
- Draft roadmap shape and **Node** catalog live under `knowledge-graph/` (for example `zero-to-pmf-mission-control-hub.md`, `zero-to-pmf-node-catalog.md`); IDs and edges are **not** final until product review.
- A voice **Session** with one **Customer Persona** is the first shipped **Node** on the **Grid**; later **Nodes** may include ICP-to-lead workflows and interview capture through synthesis to roadmap-style outputs.
- **Platform store** (database) holds structured product truth per **Founder**; each **Node** **plugin** has a **Node Workspace** (files) for the **Journey Brain**; **sync** consolidated summaries from database into **Node Workspace** after milestones.
- **Node Workspace** content is private per **Founder** per **Node**; **Platform store** holds what the web app queries directly (sessions, reports, keys, progression).
- The **Journey Brain** should treat **Founder Goal** and validated **Bottleneck** as primary steering inputs (goal → system → constraint → smallest test), not generic task lists.
- **Journey Brain** is one meta-agent across **Nodes**; each **Node** is a **plugin** (Codex-style) with **Node Runtime**, **Node Skill**, and **Node Workspace**; the brain consumes consolidated **Node artifacts** (database + synced files), not necessarily all raw data on every turn.
- V1 includes **Landing Page**, authentication, **Command**, **Grid** (one interview **Node**), that **Node**'s **Active Node surface** with **Practice Dashboard** chrome (**Start Practice**, **Profile Settings**, **Founder API Key** configuration, **Voice Conversation**, **Report Generating State**, **Session Report**, **Progression**, **Achievement Nodes**, **Insufficient Data State**), **Gemini provider** for all LLM and voice calls, plus **Journey Brain** and **Node Workspaces** per the rebuilt backend—not legacy top-level routes for this shell
- V1 excludes teams, coaches, exact retry, text chat mode, default **Audio Recording**, showing next practice focus outside the **Session Report**, past-weakness personalization, public report sharing, and lesson-style onboarding
- A **Session** contains zero or more **Traps**
- A **Trap** appears inside the conversation flow and is evaluated after the **Session**, not explained during it
- A **Session** has exactly one **Customer Persona**
- A **Session** is a **Voice Conversation**, not a text chat
- A **Voice Conversation** includes **Conversational Friction** while remaining coherent enough to evaluate
- **Hidden Evaluation** assesses **Interview Behavior**, including question quality and basic conversational conduct
- In v1, **Hidden Evaluation** does not score accent, vocal polish, charisma, or sounding confident
- **Profile Settings** may contain multiple **Ideal Customer Profiles**
- At most one **Ideal Customer Profile** is the **Active Ideal Customer Profile**
- One **Ideal Customer Profile** can produce many different **Customer Personas**
- A **Session** selects one generated **Customer Persona**, either randomly or shaped by the user's **Active Ideal Customer Profile**
- Without an **Active Ideal Customer Profile**, **Customer Personas** come from the **Broad Practice Pool**
- Editing or switching the **Active Ideal Customer Profile** affects future **Sessions**, not past **Generated Session Cases** or reports
- The simulator does not receive startup idea input in v1
- A **Session** may end before 60 minutes, but never exceeds 60 minutes
- V1 is single-player: one **Learner** owns their **Progression**, **Global Ranking**, reports, **Founder API Key** configuration, and optional **Ideal Customer Profile**
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
- After sign up or log in, the user reaches **Command** by default without lesson-style onboarding; opening the interview **Node** from **Grid** reaches the **Active Node surface** with **Practice Dashboard** chrome
- A user may define an **Ideal Customer Profile** from **Profile Settings**
- **Start Practice** requires a configured **Founder API Key**; the platform does not run **Sessions** or non-live LLM flows without it
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
> **Domain expert:** "Landing, auth, **Command**, **Grid** with the interview **Node**, optional ICP settings, voice practice inside that **Node**, report, credits, progression, and ranking placeholder. Leave collaboration, lessons, text fallback, exact retry, and personalization out."
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
> **Domain expert:** "No — **Command** is the default home; the interview **Active Node surface** is centered on starting another practice loop and reviewing progress."
> **Dev:** "Can coaches or teams review reports in v1?"
> **Domain expert:** "No — v1 is for one **Learner** improving their own interview skill."
> **Dev:** "Can users share reports publicly?"
> **Domain expert:** "No — **Session Reports** and **Session Transcripts** are private to the **Learner** in v1."
> **Dev:** "Do we store the actual call audio?"
> **Domain expert:** "No — v1 does not store **Audio Recording** by default; the durable artifacts are transcript, evaluation, and report data."
> **Dev:** "Should the dashboard show next practice focus?"
> **Domain expert:** "No for v1 — the **Session Report** owns next practice focus to keep the interview **Active Node surface** simple."
> **Dev:** "Does the authenticated app repeat the landing-page promise?"
> **Domain expert:** "No — the **Landing Page** handles marketing. After sign up or log in, the user goes to **Command**."
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

- **V1** slice (Q14): resolved — **Command** is a **real** surface (not a stub); **Grid** shows **one** interview **Node**; selecting it opens the fully interactive **Active Node surface** (existing voice **Session** / **Practice Dashboard** chrome); **Journey Brain** and **Node Workspaces** are whatever the **rebuilt backend** needs for that path (incremental depth, not “build the entire future graph engine” before ship). Defer elaborate **Pinned Node** auto-workset and **Node work state** until after baseline loop works.
- Product direction: **Journey Brain**, **Node Workspaces**, **Command**, **Grid**, and **Nodes** are the hero scope; the voice-first **Session** practice is the first **Node**; more **Nodes** follow (for example ICP-to-leads). Many **Relationships** bullets still describe interview-**Node** behavior in detail; align copy as the shell hardens.
- **Journey Brain** implementation direction: LangChain **Deep Agents** harness (planning, virtual filesystem tools, subagents, pluggable backends, LangGraph runtime); **v1 runtime: TypeScript first** via **deepagentsjs** alongside the Next.js app; Python **deepagents** only if a concrete capability gap forces it. Production still uses **Platform store** for contracts and secrets.
- Durable **Node Workspace** bytes (v1): persist across visits; file backing via **Platform store** and/or LangGraph durable virtual FS (implementation detail); object buckets deferred unless needed.
- Hybrid storage resolved: **Platform store** = **database** for product UI and structured truth; **Node Workspace** = per-**Node** **plugin** files for the **Journey Brain**; **sync** consolidated summaries from database events into **Node Workspace** after sessions (and similar milestones).
- **Brain data diet** (Q17): resolved — **sync both**; database is source of truth for UI; **Node Workspace** holds consolidated, searchable agent context; raw data remains available when the brain needs to dig in, via search/tools, not full-context dump every turn.
- **Founder Goal** gate vs graph: Q7 reframed — the **Node** catalog and graph topology are **prebuilt** and shipped; the **Journey Brain** does not "spawn" novel **Node** types on demand. Whether a durable **Founder Goal** must exist before specific **Nodes** (for example paid lead gen or outbound) is still a separate policy decision.
- Public promise framing (outcome vs capability language): deferred — **Founder** intent emphasizes *operational velocity* in the sense of how fast-moving builders are praised (constraint focus, iteration speed), not a narrow marketing A/B; refine honest external copy later.
- **Founder** read access to **Node Workspace**: resolved for v1 — **Founders** should be able to **read** agent-backed artifacts in **Node Workspaces**; the specific UI entry point is **undecided** and is **not** assumed to live only inside **Command**; direct in-UI hand-editing is **not** committed for v1.
- **Command** / **Dashboard** / **Mission Control**: resolved — spoken and written interchangeably for the **same** global operational sidebar module; **canonical glossary term** is **Command** unless engineering standardizes on another single string in code.
- **Practice Dashboard** vs **Command**: resolved — **Command** (aka **Dashboard** / **Mission Control**) is the global operational sidebar module; **Practice Dashboard** names the interview-practice chrome **inside** the interview **Node**'s **Active Node surface** only.
- **Command** vs **Grid** (Q8): resolved for v1 — **strict separation** of primary sidebar modules; **Command** = operational / bottleneck / "what now"; **Grid** = PMF **Node** map and entry into **Active Node surfaces**; link across modules, do not duplicate the full map as the main **Command** canvas.
- Prerequisite / gate **skip** policy (Q9): intentionally deferred — revisit when **Command**/**Grid** shell and **Node** catalog are stable.
- **Grid** → map return (Q11): baseline accepted — compact **`<`-style** control from **Active Node surface**; breadcrumbs and fuller chrome **TBD**.
- **Pinned Node** behavior (Q12): **vision in flux** — expect **Node work state** + **active workset** (often one bottleneck **Node**, sometimes two parallel) to drive which **Nodes** deserve sidebar prominence; auto-retire pins when focus moves; tie to **Command** "what now"; mix of deterministic state vs agent judgment **not** chosen; coexists with **Founder**-initiated pin sketch until reconciled; cap/overflow rules revisit once auto-surfacing exists.
- **Command** (global module) vs **Node**-local layouts: resolved linguistically — use **Active Node surface** for the full-panel **Node** UI opened from **Grid**; reserve **Command** for the global sidebar module (_aliases_: **Dashboard**, **Mission Control**).
- "v1 scope" was clarified: keep the core voice practice/report/progression loop and exclude adjacent collaboration, course, sharing, personalization, and fallback surfaces.
- "googly" was used to mean a possible test inside the conversation; resolved: use **Trap**.
- "auto" was compared to artificial society products; resolved: use **Auto-Generated Persona** for a simple generated counterpart, not a simulated audience.
- "what the user brings into a Session" was too broad; resolved: the user may provide an **Ideal Customer Profile** in **Profile Settings**, not during each **Session**.
- "hidden idea context" was considered; resolved: v1 has no startup idea input, hidden or otherwise.
- "persona source" sounded like a pre-session form; resolved: **Customer Personas** are generated per **Session**, while the optional **Ideal Customer Profile** lives in **Profile Settings**.
- "ICP" was clarified: users may manage multiple **Ideal Customer Profiles** and select one **Active Ideal Customer Profile**.
- "random personas" was clarified: no active ICP uses a **Broad Practice Pool** of realistic discovery contexts.
- "difficulty" sounded user-selected; resolved: difficulty adapts from **Progression** and **Global Ranking**.
- "main screen" was clarified: default authenticated home is **Command** (aka **Dashboard** / **Mission Control**); interview practice lives in the interview **Active Node surface** (**Practice Dashboard** chrome), not a course-style surface.
- "user" was clarified: v1 serves an individual **Learner**, not teams, coaches, or organizations.
- "report privacy" was clarified: **Session Reports** and **Session Transcripts** are private by default with no sharing in v1.
- "voice storage" was clarified: no **Audio Recording** by default in v1.
- "next practice focus" was clarified: keep it in the **Session Report**, not centered on the v1 **Command** module or the interview **Active Node surface** home.
- "onboarding" was clarified: use a public **Landing Page** before auth, not a lesson-style onboarding step after auth.
- "product name" was clarified: **Product display name** is `ApexPMF` in UI; **Product app name** is `ApexPMF` for metadata and integrations.
- "landing copy" was clarified: **Product tagline** is `Speedrun Product-Market Fit`; **Product description** is the AI-agent PMF sentence used in hero and metadata.
- **Journey Brain** vs **Node Runtime** (interview): resolved for v1 — interview **Node Runtime** runs voice **Sessions** and existing LLM workflows; **Journey Brain** is not in the per-turn voice loop; it learns from **Node artifacts** (reports, progression, summaries) to steer journey and **Command**. **TBD:** exact artifact schema per **Node**; how agentic vs HITL each **Node** becomes over time.
- **Gemini provider** (refactor): resolved — remove **OpenRouter**; use **Google Gemini API** for non-live LLM (persona generation, **Hidden Evaluation**, **Journey Brain**) and existing Gemini Live voice paths.
- **Monetization** (refactor): resolved — **bring your own API key** via **Founder API Key**; no subscription, in-app pricing, **Credits**, **Free Trial Session**, or **Credit Exhaustion** in the refactor. **V1:** one **Google AI Studio / Gemini API key** per **Founder** for all Gemini surfaces (voice + non-live LLM). **TBD:** key storage (encryption, rotation UI), quota/error UX when the key fails.
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
