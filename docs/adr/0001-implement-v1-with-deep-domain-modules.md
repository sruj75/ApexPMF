# Implement v1 with deep domain modules

V1 will be implemented as a small set of deep domain modules rather than UI-first feature slices, thin prompt wrappers, or many tiny pass-through classes. The simulator's complexity lives in Session lifecycle, persona generation, voice runtime behavior, hidden evaluation, reporting, credits, and progression; concentrating that knowledge behind simple module interfaces should reduce change amplification and keep hidden mechanics out of screens and transport callbacks.

**Considered Options**

- UI-first feature slices, where each screen coordinates the product behavior it needs.
- Many small helpers around prompts, voice events, scoring, reports, and credits.
- Deep domain modules that own the product rules and expose simple interfaces to the UI and runtime edges.

**Consequences**

Implementation work should begin by defining module contracts and behavior tests around the domain boundaries named in `SOFTWARE.md`. Future changes should avoid leaking prompt formats, voice-provider details, hidden test-plan structure, credit rounding, or progression thresholds across module boundaries.
