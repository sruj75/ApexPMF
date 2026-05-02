# Architecture

This file is the contributor map for the codebase: where to look, what each coarse module does, and which boundaries must not be crossed. It should stay short and stable. Product requirements live in `PRD.md`; domain language lives in `CONTEXT.md`; UI style lives in `DESIGN.md`; coding doctrine lives in `SOFTWARE.md`; decision rationale lives in `docs/adr/`.

## Bird's-Eye View

The Mom Test Simulator is a single-player, voice-first practice app. A Learner starts a Session, interviews a fresh LLM-generated Customer Persona, then receives a structured Session Report that drives Progression.

V1 is a modular monolith: one Next.js app, 100% TypeScript, Effect at meaningful workflow boundaries, Supabase behind repository/data-access code, Gemini Live behind Voice Runtime, and normal LLM calls behind the domain modules that use them.

## Codemap

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

`app/` contains Next.js routes and UI surfaces. Look here for page composition, navigation, server actions/routes, and rendering of Practice Dashboard, Profile Settings, Voice Conversation, Report Generating State, and Session Report.

`src/application/` contains Effect-powered workflows that coordinate domain modules. Look here for flows such as starting a Session, ending a Session, generating a report, finalizing Credits, and updating Progression.

`src/domain/session/` owns Session lifecycle concepts: Start Practice, Opening Context delivery, Voice Conversation state, end reasons, Natural Conclusion, Report Generating State, and routing to the Session Report.

`src/domain/persona/` owns Persona Generation. Look here for Ideal Customer Profile and Broad Practice Pool inputs, fresh Customer Persona generation, hidden backstory, Customer Fit, Traps, Concrete History, Opening Context, and the small pre-Session quality gate.

`src/domain/evaluation/` owns Hidden Evaluation. It evaluates Interview Behavior after Session end from the structured transcript and Generated Session Case. It does not provide live coaching and does not create persona truth.

`src/domain/report/` owns Report Builder and Session Report structure. Look here for reportability, partial-report decisions, structured report sections, prose display content, Trap Results, and Expandable Evidence.

`src/domain/credits/` owns free trial, paid usage, estimates, duration rounding, Credit Exhaustion, and fair failed-voice charging.

`src/domain/progression/` owns Progression, Achievement Nodes, and the Global Ranking credibility gate. In v1 it reads saved Session Reports only.

`src/infrastructure/supabase/` adapts Supabase tables, rows, auth payloads, and storage concerns into domain objects.

`src/infrastructure/gemini/` adapts Gemini Live API behavior into Voice Runtime events and transcript/session events.

`src/infrastructure/llm/` contains shared low-level non-live LLM transport: API execution, keys, logging, timeouts, and provider response handling. Domain modules still own their own prompts, schemas, parsing, retries, and validation.

## Architectural Invariants

- UI renders product states and invokes application actions; it does not calculate domain behavior.
- Domain modules do not import UI, Next.js request objects, Supabase clients, Gemini clients, or raw LLM clients directly.
- Generated Session Case is the internal aggregate for hidden case context, transcript, evaluation artifacts, report, and audit context.
- Customer Personas are generated fresh per Session. Ideal Customer Profiles and Broad Practice Pool seeds steer generation; they are not fixed persona fixtures.
- Persona Generation is the source of persona truth. Voice Runtime may express unreliable social signals, but Concrete History must stay consistent with the Generated Session Case.
- Session Reports are stored as structured sections with prose display content. Progression reads saved Session Reports only.
- Session Transcripts are stored as structured turns. Plain text transcripts are convenience views.
- Raw Audio Recording is not stored by default.

## Boundaries

**App to Application**: Next.js surfaces call application workflows. They should not call Supabase, Gemini, or LLM transport directly for domain behavior.

**Application to Domain**: Application workflows coordinate modules and side effects. They should not absorb business rules that belong to Session, Persona Generation, Report Builder, Credits, or Progression.

**Domain to Infrastructure**: Domain modules speak in domain objects. Infrastructure translates provider/database shapes at the edge.

**Voice Runtime**: Gemini Live is the v1 default. Keep the adapter small; do not build speculative multi-provider voice abstractions.

**LLM Calls**: Persona Generation, Hidden Evaluation, and Report Builder each own their own prompt/schema boundary. Share transport plumbing only.

## Cross-Cutting Concerns

**Effect**: Use Effect where it clarifies typed failures, retries, interruption, concurrency, resource cleanup, and observability. Do not wrap tiny pure helpers in Effect ceremony.

**Effect Schema**: Validate external boundary data: LLM responses, Gemini events, Supabase rows, and user-created Ideal Customer Profile input.

**Post-Session Work**: Report generation and Progression updates run directly in v1 while the user sees Report Generating State. Add queues/workers only after measured reliability or latency pressure.

**Testing**: Test product behavior and domain rules through module boundaries. Avoid tests that depend on exact prompt wording, provider payloads, Supabase row shapes, or private implementation details unless the test is specifically for that adapter.
