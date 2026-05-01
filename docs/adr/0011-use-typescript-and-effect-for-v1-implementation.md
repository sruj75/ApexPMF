# Use TypeScript and Effect for v1 implementation

V1 will be implemented in TypeScript, with Effect used at domain and integration boundaries for typed failures, retries, interruption, concurrency, resource cleanup, and observability. Effect should help keep voice, LLM, Supabase, credits, and report-generation workflows explicit without adding ceremony around simple pure code.

**Considered Options**

- Use plain TypeScript promises and ad hoc error handling everywhere.
- Introduce separate backend/runtime languages for specialized pieces.
- Use TypeScript throughout v1 and Effect at the boundaries where controlled side effects reduce complexity.

**Consequences**

Module APIs should make failure modes visible. Voice Runtime, LLM transport, repository/data-access code, Credits, Session Orchestrator, and Report Builder are good candidates for Effect workflows. Simple deterministic domain helpers should remain plain TypeScript when that is clearer.
