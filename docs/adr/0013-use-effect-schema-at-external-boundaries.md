# Use Effect Schema at external boundaries

Effect Schema will validate data at external boundaries: LLM responses, Gemini Live API event translation, Supabase row translation, and user-created Ideal Customer Profile input. Internal domain code should use typed domain objects and invariants rather than require schemas around every pure helper.

**Considered Options**

- Validate boundary data ad hoc inside each module.
- Wrap nearly every internal domain value in schemas.
- Use Effect Schema where provider, database, model, or user input crosses into the domain.

**Consequences**

The riskiest data conversions become explicit and testable without making the whole codebase schema-heavy. Domain tests should still focus on behavior and invariants, while boundary tests verify decoding failures and accepted shapes.
