# Let Report Builder own reportability

`Report Builder` will own the decision that a completed or failed Session has enough evidence to produce a full or partial Session Report. Session Orchestrator routes ended Sessions into report generation, Voice Runtime reports voice and transcript events, and Credits handles fair charging, but none of those modules should decide whether the user receives coaching.

**Considered Options**

- Let Session Orchestrator decide reportability based on the end state.
- Let Voice Runtime decide reportability after failures.
- Let Report Builder decide reportability from transcript coverage, evaluation artifacts, traps, and case context.

**Consequences**

Partial-report thresholds should be tested through Report Builder behavior. UI and billing code should receive a report-generation result rather than duplicate rules for minimum evidence, transcript sufficiency, or evaluation confidence.
