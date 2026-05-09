# Architecture

This document is the architecture contract for the repository. Keep it aligned with `PRD.md`, `CONTEXT.md`, `SOFTWARE.md`, and `docs/adr/` decisions.

## Bird's-eye Overview

The Mom Test Simulator is a modular-monolith Next.js app where a Learner starts practice, gets a fresh generated Customer Persona, and continues through a voice-first Session loop into post-session feedback.

Current implementation is a narrow vertical slice around Session entry:
- authenticated entry and route guards,
- Active Ideal Customer Profile or Broad Practice Pool resolution,
- Persona Generation through OpenRouter structured JSON,
- persistence of Generated Session Case in Supabase,
- redirect into the practice session route.

The contract still reserves the full v1 module seams from ADRs: Session lifecycle orchestration, Voice Runtime (Gemini Live default behind adapter), Hidden Evaluation, Report Builder, Credits, and Progression.

## Codemap

```text
app/
  auth/*
  login
  signup
  dashboard
  practice/*
  profile/*
src/
  application/start-session/*
  domain/persona/*
  domain/session/*
  infrastructure/supabase/*
  infrastructure/llm/openrouter.ts
  infrastructure/http/safe-next-path.ts
tests/*
docs/adr/*
```

`app/*`: Next.js routes, server actions, and UI surfaces. Owns rendering and navigation only.

`app/practice/actions.ts`: practice entry action. Converts seam results into redirects.

`src/application/start-session/*`: application seam for Start Practice flow. Handles entry context, failure classification, and orchestration of domain/repository dependencies.

`src/domain/persona/*`: domain definitions for Ideal Customer Profile, Session Source, Persona Generation contract, and OpenRouter-backed persona generation behavior.

`src/domain/session/*`: Generated Session Case aggregate shape, Started Session projection, and repository interface.

`src/infrastructure/supabase/*`: Supabase adapters for auth context and repository persistence/decoding.

`src/infrastructure/llm/openrouter.ts`: low-level non-live LLM transport for structured JSON completion.

`tests/*`: contract and seam tests for auth entry, profile/session source rules, generated case decode/persistence, OpenRouter client/generator behavior, and route/action behavior.

`docs/adr/*`: durable architecture/software decisions; architecture changes must reconcile with these.

## Architectural Invariants

- V1 remains one Next.js TypeScript app; no split deployable services.
- UI code in `app/*` renders state and triggers application seams. It does not implement domain rules.
- `src/application/*` composes workflows and error mapping. It does not own persona truth, reportability, progression logic, or credit policy.
- Domain contracts (`src/domain/*`) are storage/provider-agnostic at their boundaries and use product language from `CONTEXT.md`.
- Boundary inputs are parsed into typed domain shapes at ingress (parse, don't validate). Avoid passing unrefined external data plus ad-hoc boolean checks deeper into domain/application layers.
- Supabase access stays behind repository/adaptor modules in `src/infrastructure/supabase/*`.
- Non-live LLM transport stays in `src/infrastructure/llm/*`; domain modules own prompt/schema/quality logic for their use cases.
- Customer Personas are generated fresh per Session from Session Source inputs; they are not fixed fixtures.
- Generated Session Case is the internal aggregate for generated persona context and downstream evaluation/report auditing.
- Voice Runtime remains a boundary seam; when implemented, Gemini Live is the default adapter behind that seam.
- Hidden Evaluation remains post-session and non-coaching in v1.

## Boundaries

`app -> application`: routes and server actions call seam/workflow functions; they do not call Supabase tables or provider APIs for business behavior.

`application -> domain`: workflows pass learner/session inputs and coordinate domain interfaces; business policy stays in the owning domain module.

`application -> infrastructure`: dependency wiring occurs at seams (for example repository and provider client construction), keeping external details out of UI.

`domain -> infrastructure`: domain modules consume repository/provider interfaces and domain DTOs; row shapes, auth payloads, and HTTP response formats are decoded at infrastructure edges.

`persona generation -> llm transport`: Persona Generation owns system/user prompt content, structured schema contract, decode failures, and quality gates; OpenRouter client owns HTTP protocol concerns only.

`hidden evaluation -> llm transport`: Hidden Evaluation owns judge prompt source, structured response contract, decode and retry policy, and transcript evidence quality gates; OpenRouter adapter owns transport translation only.

`session source -> profile repository`: active profile lookup happens once at Session start; Session Source is snapshotted into Generated Session Case for historical consistency.

`future voice/report/progression seams`: add new modules under `src/domain/*` and `src/application/*` without bypassing the same boundary direction.

## Cross-cutting Concerns

`Boundary parsing`: external data is parsed/decoded into refined shapes at boundaries (Supabase row decoders, structured JSON decode paths, safe redirect path checks), then consumed as trusted typed values internally.

`Error shaping`: use explicit failure categories for learner entry/start failures so redirects and UX outcomes are deterministic.

`Security and auth`: learner identity is resolved server-side via Supabase auth context; unauthenticated access redirects to auth entry points.

`Observability`: provider and decode failures are surfaced as typed/domain errors with enough context for debugging without leaking provider payload shapes into UI.

`Testing strategy`: prioritize behavior tests around domain/application boundaries and adapter contract tests; avoid brittle assertions on incidental provider payload formatting.
