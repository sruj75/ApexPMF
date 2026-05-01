# Keep Ideal Customer Profiles minimal in v1

Ideal Customer Profiles will be minimal typed domain objects in v1: a name, a customer description, and optional notes. Profile Settings should support multiple profiles and one Active Ideal Customer Profile, but it should not become startup-idea input, per-session setup, or a heavy segmentation workflow.

**Considered Options**

- Store only one freeform text blob.
- Build a detailed ICP form with many structured segmentation fields.
- Use a minimal typed profile with just enough structure for naming, persona generation, and future reports.

**Consequences**

Persona Generation receives a clear Active Ideal Customer Profile without forcing the Learner through setup friction. The product preserves the PRD constraint that v1 trains customer interview skill rather than pitch validation.
