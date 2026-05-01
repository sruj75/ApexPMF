# Keep persona quality validation inside Persona Generation

Persona Generation will run a small pre-Session quality gate before a generated Customer Persona is used. The gate checks for a coherent persona, enough Concrete History, clear Customer Fit, usable Traps, and safe Opening Context; if invalid, Persona Generation may repair or regenerate a limited number of times.

**Considered Options**

- Trust every generated persona without validation.
- Add a separate persona QA service or elaborate scoring workflow.
- Keep a simple quality gate inside Persona Generation.

**Consequences**

V1 gets basic fairness and coherence protection without adding a new subsystem. Regeneration should be bounded so persona creation cannot loop indefinitely or become a hidden source of latency.
