# Software Design

This document defines how the product should be implemented so the codebase stays understandable as the simulator grows. `PRD.md` owns product requirements, `CONTEXT.md` owns domain language, `DESIGN.md` owns UI style, `ARCHITECTURE.md` owns system shape and runtime boundaries, and `SOFTWARE.md` owns the coding design doctrine.

## Design Goal

Build v1 as a small set of deep domain modules with simple interfaces and hidden internal complexity.

The product has inherently complex behavior: voice sessions, generated personas, hidden evaluation, reports, credits, progression, and privacy. The implementation should concentrate that complexity inside modules that own real domain knowledge rather than spread it across screens, prompt helpers, transport callbacks, or many tiny pass-through classes.

Current software design score: 7/10. The PRD names strong module boundaries, but the code does not exist yet, so the remaining work is to preserve those boundaries during implementation with simple interfaces, clear invariants, and tests that exercise behavior through the module boundaries.

## Current Stack Assumptions

The current implementation direction is 100% TypeScript, Next.js for the app, Effect for typed effects/errors/retries/interruption/concurrency at domain and integration boundaries, Supabase for persistence/auth/data infrastructure, Gemini Live API as the v1 Voice Runtime default, and a normal LLM API path for non-live generation and evaluation calls.

These choices should not leak through domain interfaces. Gemini event formats, Supabase table shapes, model prompts, and provider-specific response schemas belong behind module boundaries. Keep this boundary simple: one Voice Runtime adapter for Gemini is enough for v1, and use the small Effect surface needed for clear typed failures and resource control.

V1 should be a single Next.js app with strong internal module boundaries, not separate deployable services.

Report generation and Progression updates should run in the direct post-Session app flow first. Use Effect timeouts, interruption, retries, and typed failures to keep that flow controlled; do not introduce background queues or workers until a concrete reliability or latency problem appears.

Supabase should be used through a repository/data-access boundary. Domain modules speak in product concepts such as Generated Session Case, Session Transcript, Session Report, Credits, and Progression; they do not depend on tables, rows, storage buckets, or Supabase auth payloads.

## Module Doctrine

Deep modules should hide important decisions:

- **Session Orchestrator** owns the Session lifecycle from `Start Practice` through `Report Generating State` and report routing. It coordinates lifecycle states, Natural Conclusion, and module calls, but it does not own credit rounding, reportability, report scoring, persona truth, Hidden Evaluation rules, or Progression movement.
- **Persona Generation** owns fresh LLM-generated Customer Persona creation from an Active Ideal Customer Profile or Broad Practice Pool seed. It is the source of truth for hidden backstory, Customer Fit, Traps, Concrete History, the truthfulness contract, and the Opening Context as a safe public projection of the Generated Session Case. It also owns a small local quality gate before Session start.
- **Generated Session Case** is the central internal aggregate for an attempted or completed Session. It owns the durable record needed to audit fairness and report quality: generated persona, hidden backstory, Customer Fit, Hidden Test Plan, Traps, transcript, evaluation artifacts, report, and audit context.
- **Voice Runtime** owns voice transport, transcription, persona speech, interruption behavior, latency, and voice failure details. It may express unreliable social signals, but it must enforce the persona truthfulness contract by not inventing false Concrete History outside the Generated Session Case.
- **Hidden Evaluation** owns Interview Behavior assessment without leaking live coaching into the user experience. In v1, it runs after the Session ends from the structured transcript and Generated Session Case, unless the voice runtime provides cheap structured signals worth preserving without acting on live.
- **Report Builder** owns the transformation from transcript, evaluation, traps, and case context into a Session Report. It also owns the final decision that a completed or failed Session has enough evidence to generate a full or partial report. The saved Session Report should be structured data as the source of truth, with user-facing prose as display content.
- **Credits** owns free trial, paid usage, duration rounding, credit exhaustion, and fair failure handling.
- **Progression** owns skill movement, Achievement Nodes, and the credibility gate for Global Ranking. In v1, it updates only from the saved Session Report, not raw transcript, hidden artifacts, or separate evaluation summary fields.

Each module should expose the simplest interface that covers current v1 needs. Avoid per-screen logic that knows hidden test-plan details, prompt internals, credit rounding rules, voice-provider mechanics, or progression thresholds.

## Initial Code Organization

Use a light modular-monolith folder structure:

```text
app/
src/
  domain/
    session/
    persona/
    evaluation/
    report/
    credits/
    progression/
  application/
    start-session/
    end-session/
    generate-report/
  infrastructure/
    supabase/
    gemini/
    llm/
```

The exact names can evolve, but the dependency direction should stay stable: UI calls application workflows, application workflows coordinate domain modules, infrastructure adapts external systems, and domain modules do not import UI or provider clients.

## Complexity Rules

- Prefer one deep module over several shallow wrappers when those wrappers share the same knowledge.
- Organize around owned knowledge, not temporal steps like read, validate, process, and write.
- Keep UI thin. Screens render product states and invoke application actions; they do not calculate domain behavior.
- Keep prompt formats, provider events, scoring artifacts, and storage details behind module boundaries.
- Treat prompt wording, model/provider event schemas, scoring artifact formats, and storage schemas as private implementation details.
- Keep Supabase behind repository/data-access code so storage shape can change without rewriting domain behavior.
- Use Gemini directly through the Voice Runtime boundary; do not build a broad multi-provider voice abstraction before the product needs it.
- Let Persona Generation, Hidden Evaluation, and Report Builder own their own LLM prompts, schemas, parsing, retries, and domain validation. Share only low-level LLM transport concerns such as API execution, keys, logging, and timeouts.
- Use TypeScript across the app and backend code. Do not introduce a second implementation language in v1.
- Use Effect where it reduces real complexity: typed domain failures, retries, interruption, concurrency, resource cleanup, and observability around voice, LLM, Supabase, credits, and report generation.
- Use Effect Schema at external boundaries: LLM responses, Gemini event translation, Supabase row translation, and user-created Ideal Customer Profile input.
- Keep Effect code readable and local to meaningful boundaries. Avoid abstract Effect machinery when plain TypeScript is clearer.
- Keep v1 as a modular monolith: one deployable Next.js app with explicit internal modules.
- Keep the folder structure simple and boundary-oriented. Do not create one folder per tiny helper or mirror every screen as a domain module.
- Keep post-Session work direct in v1. Report Builder and Progression may run after Session end while the user sees Report Generating State.
- Push defaults and recovery behavior downward so UI callers do not need to coordinate special cases.
- Tests should verify product behavior and domain rules through module boundaries, not private prompt wording or incidental implementation details.
- Comments should document module contracts, invariants, and design intent where code alone cannot explain why the boundary exists.
- End states may trigger report generation, but reportability belongs to Report Builder, not Session Orchestrator, Voice Runtime, Credits, or UI code.
- Persona truth is generated once and preserved in the Generated Session Case. Runtime behavior may be socially unreliable, but Concrete History must stay consistent with that preserved truth.
- Session Orchestrator should stay boring: it knows the lifecycle and end reasons, then delegates product rules to the modules that own them.
- Progression consumes saved Session Reports only in v1. Report Builder is responsible for producing the report content Progression can learn from.
- Session Reports should have typed sections for outcome, missed signals, bad questions, strong questions, Trap Results, skill movement, next practice focus, ICP/source context, light persona label, and Expandable Evidence.
- Session Transcripts should be stored as structured turns with speaker, order/timestamp, text, and useful voice/failure metadata. Plain text or rendered transcript views are convenience outputs, not the source of truth.
- Hidden Evaluation is hidden because it is not visible during the Session, not because it must run concurrently with live voice.
- Natural Conclusion is a Session Orchestrator lifecycle decision based on simple live-session signals such as time, turn count, practiced material, and conversational stopping point. It should not require live Hidden Evaluation.
- Opening Context is generated by Persona Generation, delivered by Session Orchestrator, and rendered by UI. It must be consistent with the Customer Persona without leaking hidden backstory, Customer Fit, Traps, or Hidden Test Plan.
- Ideal Customer Profiles should stay minimal in v1: a name, a customer description, and optional notes. They are typed domain objects and generation inputs, not predetermined dummy personas. Profile Settings should not become startup-idea input or a heavy segmentation workflow.
- Customer Personas are LLM-generated fresh per Session from the Active Ideal Customer Profile or Broad Practice Pool. Practicing again from the same Ideal Customer Profile creates a different Customer Persona.
- Broad Practice Pool should be a small curated set of broad practice seeds. The seeds guide diversity; they are not fixed Customer Personas.
- Persona Generation should run a simple pre-Session quality gate: coherent persona, enough Concrete History, clear Customer Fit, usable Traps, and safe Opening Context. If invalid, repair or regenerate a limited number of times.

## Red Flags

- UI code decides whether a Session has enough evidence for a partial report.
- Voice Runtime or Credits decides whether a failed Session deserves a partial report.
- Session Orchestrator contains credit rounding, report scoring, persona truth, evaluation thresholds, or progression formulas.
- Voice Runtime or post-session Hidden Evaluation decides Natural Conclusion.
- UI code calculates Progression, chooses Traps, rounds Credits, branches on raw voice-provider events, or inspects Hidden Test Plan.
- Tests assert exact prompt wording, provider event payloads, or scoring artifact structure instead of domain outcomes.
- Domain modules import Supabase clients directly or pass database row shapes through their interfaces.
- Voice Runtime grows provider-switching abstractions that are not needed for the Gemini v1 path.
- A generic AI service owns persona generation, evaluation, and report-building behavior as one vague module.
- Effect is used to wrap every small pure function or to introduce layers where a direct function would be simpler.
- Internal domain code becomes a schema factory instead of using clear typed domain objects and invariants.
- Non-TypeScript services appear in v1 without a hard runtime reason.
- Persona Generation, Voice Runtime, Hidden Evaluation, Report Builder, Credits, or Progression become separate deployable services before there is a concrete need.
- Domain modules import UI components, Next.js request objects, Supabase clients, Gemini clients, or raw LLM clients directly.
- Background queues, workers, or job orchestration appear before report generation or progression updates have proven they need them.
- Progression or UI parses report prose to recover fields that should have been stored structurally.
- Report Builder or UI relies on plain transcript text when structured turns are needed for evidence and audit.
- Session Orchestrator or UI invents Opening Context copy without going through Persona Generation.
- Profile Settings grows a large ICP form, startup idea fields, per-session configuration, segmentation workflow, or predetermined dummy persona library.
- Broad Practice Pool becomes either fully unbounded random generation or a fixed library of reusable dummy personas.
- Persona quality checks become a separate QA service, elaborate scoring system, or unbounded regeneration loop.
- Report rendering code knows hidden persona backstory or hidden test-plan structure.
- Voice-provider event shapes appear outside the Voice Runtime boundary.
- Credit rounding rules appear in multiple modules.
- Progression, Achievement Nodes, and Global Ranking thresholds are scattered across dashboard code.
- Progression inspects raw transcript, hidden test-plan data, evaluation artifacts, or side-channel evaluation summaries.
- Persona truthfulness rules are duplicated between generation, runtime behavior, and evaluation.
- Hidden Evaluation creates or mutates persona facts instead of evaluating the Learner against preserved persona truth.
- Hidden Evaluation adds live concurrency or in-session feedback pressure without a concrete v1 need.
- Multiple modules invent separate partial Session state records instead of reading from or contributing to the Generated Session Case.
- A new class or helper only forwards data without hiding any decision.

## Review Question

Every implementation review should ask: does this change reduce or increase the amount a future developer must know to safely modify a Session?
