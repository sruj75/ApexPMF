# Architecture

This document describes the system shape for v1. `PRD.md` owns product requirements, `CONTEXT.md` owns domain language, `DESIGN.md` owns UI style, `SOFTWARE.md` owns code design doctrine, and `docs/adr/` records durable trade-offs.

## Current Stack

- **Language**: 100% TypeScript
- **App framework**: Next.js
- **Effect system**: Effect for typed errors, retries, interruption, concurrency, resource cleanup, observability, and boundary validation at domain and integration boundaries
- **Persistence/auth/data infrastructure**: Supabase
- **Voice runtime**: Gemini Live API as the v1 default for live Voice Conversation
- **LLM calls**: normal LLM API path for persona generation, hidden evaluation, and report generation where live voice is not required

These are current architecture assumptions. They are important enough to guide implementation, but provider-specific shapes should remain behind boundaries. Simplicity is the key: v1 should use Gemini directly through the Voice Runtime boundary rather than build a broad multi-provider voice layer, and should use the small Effect surface needed for typed failures and controlled side effects.

## System Shape

V1 is a single-player practice product for one Learner. The authenticated app centers a Practice Dashboard, optional Profile Settings, a voice-first Session experience, Report Generating State, Session Report, Credits, Progression, Achievement Nodes, and Global Ranking or Insufficient Data State.

V1 should ship as a modular monolith: one deployable Next.js app with clear internal domain modules. Do not split Persona Generation, Voice Runtime, Hidden Evaluation, Report Builder, Credits, or Progression into separate services until there is concrete product or operational pressure.

Post-Session work should stay in the direct app flow first. Report Builder and Progression can run while the user sees Report Generating State, with Effect timeouts, interruption, retries, and typed failures controlling the workflow. Do not introduce background queues or workers until direct generation proves too slow or unreliable.

The system should be organized around domain modules rather than screen-first feature logic:

- **App/UI layer** renders states and invokes application actions.
- **Effect-powered application boundaries** coordinate typed failures, retries, interruption, and resource cleanup where workflows touch voice, LLM calls, Supabase, credits, or report generation.
- **Session Orchestrator** coordinates lifecycle states and end reasons.
- **Persona Generation** creates and locally validates fresh LLM-generated Customer Personas from an Active Ideal Customer Profile or Broad Practice Pool seed, preserved hidden truth, and safe Opening Context.
- **Voice Runtime** translates Gemini Live API behavior into domain Session events.
- **LLM transport** provides shared low-level API execution, keys, logging, and timeouts for non-live calls.
- **Generated Session Case storage** preserves the internal aggregate for audit and report quality.
- **Hidden Evaluation** assesses Interview Behavior after the Session ends in v1, without live coaching.
- **Report Builder** decides reportability and creates structured Session Reports with prose display content.
- **Credits** handles free trial, paid usage, rounding, exhaustion, and failed-voice fairness.
- **Progression** derives skill movement, Achievement Nodes, and ranking credibility.

## Initial Module Layout

Start with a light modular-monolith layout:

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

The dependency direction should be simple: Next.js UI and routes call application workflows; application workflows coordinate domain modules with Effect; infrastructure modules adapt Supabase, Gemini, and non-live LLM transport; domain modules do not import UI or provider clients directly.

## Runtime Flow

1. The Learner selects `Start Practice`.
2. Session Orchestrator creates a Session using the Active Ideal Customer Profile or Broad Practice Pool.
3. Persona Generation creates and locally validates a fresh LLM-generated Customer Persona from the Active Ideal Customer Profile or a Broad Practice Pool seed, plus Hidden Test Plan, Traps, Customer Fit, Concrete History, and Opening Context.
4. The Generated Session Case records the hidden case context.
5. Voice Runtime runs the Voice Conversation through Gemini Live API and emits transcript/session events.
6. Hidden Evaluation evaluates Interview Behavior after the conversation from the structured transcript and Generated Session Case.
7. Session Orchestrator ends the Session by user quit, Natural Conclusion, Credit Exhaustion, Voice Failure, or the time cap.
8. Report Builder decides whether enough evidence exists and creates a full or partial Session Report when appropriate.
9. Credits finalizes usage based on actual duration and failure handling.
10. Progression updates from the saved Session Report.
11. UI routes through Report Generating State to the Session Report.

## Boundary Rules

- Next.js screens do not calculate domain behavior.
- TypeScript is the implementation language across v1.
- Effect is used at meaningful side-effect and workflow boundaries, not as ceremony around every pure helper.
- Domain modules do not import UI, Next.js request objects, Supabase clients, Gemini clients, or raw LLM clients directly.
- Effect Schema validates external boundary data such as LLM responses, Gemini events, Supabase rows, and user-created Ideal Customer Profile input.
- Supabase tables, rows, buckets, and auth payloads stay behind repository/data-access code.
- Gemini Live API event shapes stay behind Voice Runtime.
- Voice Runtime should be a small Gemini adapter in v1, not a speculative provider-switching framework.
- Prompt wording and model response parsing stay behind Persona Generation, Hidden Evaluation, and Report Builder.
- Non-live LLM calls may share transport plumbing, but prompt ownership stays with the domain module using the call.
- Generated Session Case is the central internal aggregate for hidden case context, transcript, evaluation artifacts, report, and audit context.
- Report generation and Progression updates run directly in v1 unless a measured reliability or latency problem justifies a queue.
- Progression reads saved Session Reports only in v1; it does not inspect raw transcripts, hidden artifacts, or separate evaluation summary fields.
- Session Report storage uses structured sections as the source of truth; prose is display content, not the only persisted form.
- Session Transcript storage uses structured turns as the source of truth; plain text/rendered transcript is a convenience view.
- Hidden Evaluation runs after Session end in v1. It remains hidden from the Learner during the Session, but it does not need live evaluation concurrency.
- Natural Conclusion is decided by Session Orchestrator using simple live-session signals, not by Voice Runtime or post-session Hidden Evaluation.
- Opening Context is a public projection from Persona Generation, not UI-authored copy.
- Ideal Customer Profiles are minimal v1 domain objects: name, customer description, and optional notes.
- Ideal Customer Profiles steer Persona Generation; they are not predetermined dummy personas or a persona library.
- Broad Practice Pool is a curated set of generation seeds, not a fixed persona library.
- Persona Generation owns a small pre-Session quality gate; there is no separate persona QA service in v1.
- Session Report and Session Transcript are user-facing records; the full Generated Session Case is internal by default.
- Raw Audio Recording is not stored by default.

## Documentation Workflow

When a design decision changes:

- Update `ARCHITECTURE.md` if the system shape, runtime boundary, or integration direction changes.
- Update `SOFTWARE.md` if the coding doctrine, module ownership, or complexity rule changes.
- Add an ADR only when the decision is hard to reverse, surprising without context, and the result of a real trade-off.
