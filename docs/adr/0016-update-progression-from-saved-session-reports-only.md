# Update Progression from saved Session Reports only

In v1, Progression will update only from saved Session Reports. It will not inspect raw Session Transcripts, Hidden Test Plans, evaluation artifacts, Generated Session Case internals, or separate evaluation summary fields.

**Considered Options**

- Let Progression inspect raw transcript and hidden evaluation artifacts directly.
- Let Progression consume a separate minimal evaluation summary alongside the report.
- Let Progression update only from the saved Session Report.

**Consequences**

Progression stays simple and auditable, and it does not become a second evaluator. Report Builder owns the responsibility to produce report content that can support skill movement, Achievement Nodes, and the Global Ranking credibility gate.
