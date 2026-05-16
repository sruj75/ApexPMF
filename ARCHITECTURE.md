# Architecture

This document is the architecture contract for the repository. Keep it aligned with `PRD.md`, `CONTEXT.md`, `SOFTWARE.md`, and `docs/adr/` decisions.

## Bird's-eye Overview

zeroone is a modular-monolith Next.js app where a Learner starts practice, gets a fresh generated Customer Persona, and continues through a voice-first Session loop into post-session feedback.

Current implementation covers:
- authenticated entry and route guards,
- Active Ideal Customer Profile or Broad Practice Pool resolution,
- Persona Generation through OpenRouter structured JSON,
- persistence of Generated Session Case in Supabase,
- Session lifecycle orchestration (end session, report generation),
- Hidden Evaluation via LLM-as-judge after session end,
- Session Report rendering with structured evidence and transcript,
- Profile Settings CRUD for Ideal Customer Profiles,
- redirect-based practice route lifecycle.

Application workflows use Effect for typed failures, dependency injection, retries, and resource management. The Next.js edge (`app/*`) remains Promise-only, calling thin `Effect.runPromise` wrappers in `src/application/*`.

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
  application/end-session/*
  application/generate-report/*
  application/practice-route/*
  application/llm-runtime/*
  domain/persona/*
  domain/session/*
  infrastructure/supabase/*
  infrastructure/llm/openrouter.ts
  infrastructure/gemini/*
  infrastructure/http/safe-next-path.ts
tests/*
docs/adr/*
```

`app/*`: Next.js routes, server actions, and UI view components. Owns rendering and navigation only. Imports only from `src/application/*` — never from `src/domain/*`, `src/infrastructure/*`, or `effect` directly.

`app/practice/actions.ts`: practice entry action. Converts seam results into redirects.

`app/practice/[sessionId]/actions.ts`: session end action. Delegates to session runtime seam and redirects.

`app/profile/actions.ts`: profile CRUD actions. Delegates parsing and repository calls to application seam functions.

`app/profile/page.tsx`: profile page server component. Uses `getProfilePageData` seam for auth, profile list, and session source resolution.

`src/application/start-session/*`: application seam for Start Practice flow, learner entry context, profile page data, and profile CRUD wrappers. Handles entry context, failure classification, and orchestration of domain/repository dependencies. Provides `practice-entry-web-adapter` as the thin `Effect.runPromise` boundary for `app/*`.

`src/application/end-session/*`: session orchestrator for end-session and report-generating lifecycle flows.

`src/application/generate-report/*`: report generation coordinator for post-session evaluation and report building.

`src/application/practice-route/*`: canonical route-decision seam for all practice lifecycle routes. Re-exports domain types (`StartedSession`, `SessionReport`, `SessionTranscriptTurn`) for UI view components.

`src/application/llm-runtime/*`: LLM capability layer construction from environment configuration.

`src/domain/persona/*`: domain definitions for Ideal Customer Profile, Session Source, Persona Generation contract, and OpenRouter-backed persona generation behavior.

`src/domain/session/*`: Generated Session Case aggregate shape, Started Session projection, Session Report and Transcript structures, Hidden Evaluation engine, Voice Runtime interface, and repository interfaces.

`src/infrastructure/supabase/*`: Supabase adapters for auth context and repository persistence/decoding.

`src/infrastructure/llm/openrouter.ts`: low-level non-live LLM transport for structured JSON completion.

`src/infrastructure/gemini/*`: Gemini Live voice runtime adapter.

`tests/*`: contract and seam tests for auth entry, profile/session source rules, generated case decode/persistence, OpenRouter client/generator behavior, route/action behavior, and module boundary enforcement.

`docs/adr/*`: durable architecture/software decisions; architecture changes must reconcile with these.

## Architectural Invariants

- V1 remains one Next.js TypeScript app; no split deployable services.
- UI code in `app/*` renders state and triggers application seams. It does not implement domain rules, import from `src/domain/*`, import `effect`, or throw exceptions in production paths.
- `src/application/*` composes workflows using Effect for typed failures, retries, and dependency management. It does not own persona truth, reportability, progression logic, or credit policy. Application modules provide thin `Effect.runPromise` wrappers for the Next.js edge.
- Domain contracts (`src/domain/*`) are storage/provider-agnostic at their boundaries and use product language from `CONTEXT.md`.
- Boundary inputs are parsed into typed domain shapes at ingress (parse, don't validate). Avoid passing unrefined external data plus ad-hoc boolean checks deeper into domain/application layers.
- Supabase access stays behind repository/adaptor modules in `src/infrastructure/supabase/*`.
- Non-live LLM transport stays in `src/infrastructure/llm/*`; domain modules own prompt/schema/quality logic for their use cases.
- Customer Personas are generated fresh per Session from Session Source inputs; they are not fixed fixtures.
- Generated Session Case is the internal aggregate for generated persona context and downstream evaluation/report auditing.
- Voice Runtime remains a boundary seam; Gemini Live is the default adapter behind that seam.
- Hidden Evaluation remains post-session and non-coaching in v1.
- Domain types used by view components are re-exported through application modules, not imported directly from domain.

## Boundaries

`app -> application`: routes and server actions call seam/workflow functions only. They do not call Supabase tables, provider APIs, domain resolvers, or `Effect.runPromise` directly.

`application -> domain`: workflows pass learner/session inputs and coordinate domain interfaces; business policy stays in the owning domain module.

`application -> infrastructure`: dependency wiring occurs at seams (for example repository and provider client construction), keeping external details out of UI.

`domain -> infrastructure`: domain modules consume repository/provider interfaces and domain DTOs; row shapes, auth payloads, and HTTP response formats are decoded at infrastructure edges.

`persona generation -> llm transport`: Persona Generation owns system/user prompt content, structured schema contract, decode failures, and quality gates; OpenRouter client owns HTTP protocol concerns only.

`hidden evaluation -> llm transport`: Hidden Evaluation owns judge prompt source, structured response contract, decode and retry policy, and transcript evidence quality gates; OpenRouter adapter owns transport translation only.

`session source -> profile repository`: active profile lookup happens once at Session start; Session Source is snapshotted into Generated Session Case for historical consistency.

`future voice/report/progression seams`: add new modules under `src/domain/*` and `src/application/*` without bypassing the same boundary direction.

## Cross-cutting Concerns

`Boundary parsing`: external data is parsed/decoded into refined shapes at boundaries (Supabase row decoders, structured JSON decode paths, safe redirect path checks), then consumed as trusted typed values internally.

`Error shaping`: use explicit failure categories for learner entry/start failures so redirects and UX outcomes are deterministic. Application workflows encode expected failures in the Effect error channel; `app/*` receives only redirect paths or rendered data.

`Security and auth`: learner identity is resolved server-side via Supabase auth context; unauthenticated access redirects to auth entry points.

`Observability`: provider and decode failures are surfaced as typed/domain errors with enough context for debugging without leaking provider payload shapes into UI.

`Effect at boundaries`: application and infrastructure workflows use Effect for composition, typed errors, retries, and dependency injection. The Next.js edge (`app/*`) remains Promise-only — `Effect.runPromise` calls live in `src/application/*` web adapter modules, not in route handlers or server actions.

`Testing strategy`: prioritize behavior tests around domain/application boundaries and adapter contract tests; avoid brittle assertions on incidental provider payload formatting. Module boundary tests enforce that `app/*` imports only from `src/application/*`.
