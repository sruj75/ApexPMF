# Use Generated Session Case as the internal Session aggregate

`Generated Session Case` will be the central internal aggregate for each attempted or completed Session. It ties together the generated Customer Persona, hidden backstory, Customer Fit, Hidden Test Plan, Traps, Session Transcript, evaluation artifacts, Session Report, and audit context so modules do not create competing partial Session state shapes.

**Considered Options**

- Let each module persist the slice of Session state it needs.
- Treat the Session Transcript as the primary record and reconstruct hidden context around it.
- Use `Generated Session Case` as the durable internal aggregate while keeping the user-facing Session Report and Session Transcript separate.

**Consequences**

The UI should not receive the full Generated Session Case by default. Modules may contribute to or consume the aggregate through explicit boundaries, but hidden persona details, test-plan structure, and audit-only fields should stay internal unless a post-session report intentionally exposes selected evidence.
