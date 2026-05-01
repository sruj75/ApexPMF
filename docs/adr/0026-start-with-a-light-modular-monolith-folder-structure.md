# Start with a light modular monolith folder structure

The first implementation should use a simple modular-monolith folder structure: `app/` for Next.js surfaces, `src/domain/` for Session, Persona Generation, Hidden Evaluation, Report Builder, Credits, and Progression, `src/application/` for workflows, and `src/infrastructure/` for Supabase, Gemini, and non-live LLM adapters. The folder shape is a starting boundary map, not a rigid forever-structure.

**Considered Options**

- Mirror each UI screen as its own domain area.
- Create many tiny folders/classes for every helper.
- Start with a small boundary-oriented structure that matches the product's deep modules.

**Consequences**

Domain modules should not import UI, Next.js request objects, Supabase clients, Gemini clients, or raw LLM clients directly. Application workflows coordinate modules with Effect, while infrastructure code adapts external systems into domain concepts.
