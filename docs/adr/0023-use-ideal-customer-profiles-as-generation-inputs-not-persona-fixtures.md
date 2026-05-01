# Use Ideal Customer Profiles as generation inputs, not persona fixtures

Profile Settings will store small structured Ideal Customer Profiles with optional freeform notes. These profiles steer Persona Generation, but they are not a library of predetermined dummy personas; each Session gets a fresh LLM-generated Customer Persona from the Active Ideal Customer Profile or Broad Practice Pool.

**Considered Options**

- Store fixed dummy personas and replay them across Sessions.
- Make Profile Settings a large startup-idea or segmentation workflow.
- Store small Ideal Customer Profiles as generation inputs and generate fresh Customer Personas per Session.

**Consequences**

Practicing again from the same Ideal Customer Profile should create a different Customer Persona while preserving the same broad practice focus. Profile Settings should stay small and should not ask for the Learner's startup idea in v1.
