# Keep Session Orchestrator focused on lifecycle

`Session Orchestrator` will coordinate Session lifecycle states and routing, but it will not own credit rounding, reportability, report scoring, persona truth, Hidden Evaluation rules, or Progression movement. It should know when a Session starts, enters Opening Context, runs a Voice Conversation, reaches an end reason, enters Report Generating State, and routes to a Session Report.

**Considered Options**

- Let Session Orchestrator become the central place for all Session-related business rules.
- Split lifecycle coordination across UI, Voice Runtime, Credits, Report Builder, and Progression.
- Keep Session Orchestrator focused on lifecycle coordination and delegate domain rules to their owning modules.

**Consequences**

Session Orchestrator tests should cover lifecycle paths and routing, not the details of credit math, report sufficiency, persona truthfulness, evaluation scoring, or progression thresholds. When a new Session rule appears, the default question should be which domain module owns the knowledge, not whether it can be added to the orchestrator.
