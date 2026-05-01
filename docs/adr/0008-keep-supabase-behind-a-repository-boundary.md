# Keep Supabase behind a repository boundary

Supabase will be used for v1 persistence, auth, and data infrastructure, but domain modules will not depend directly on Supabase tables, rows, buckets, or auth payloads. Repository/data-access code should translate Supabase storage shape into domain concepts such as Generated Session Case, Session Transcript, Session Report, Credits, and Progression.

**Considered Options**

- Let domain modules import Supabase clients and query tables directly.
- Mirror Supabase row shapes throughout the app as the primary data model.
- Use Supabase pragmatically while hiding storage details behind repository/data-access boundaries.

**Consequences**

Schema changes should mostly affect repository/data-access code rather than Session Orchestrator, Persona Generation, Hidden Evaluation, Report Builder, Credits, Progression, or UI screens. Tests for domain behavior should use domain objects and fakes rather than requiring real Supabase rows unless the test is specifically exercising persistence integration.
