# Keep UI thin and state-driven

The UI will render product states and invoke application actions, but it will not decide domain behavior. Session screens may show timer, end control, voice status, and speaking or listening state; dashboard and report screens may render Progression, Achievement Nodes, Global Ranking, Insufficient Data State, and recent reports, but domain modules own the rules behind those values.

**Considered Options**

- Let screens directly coordinate domain behavior for speed of implementation.
- Put all product rules behind API endpoints but allow screens to branch on raw provider and evaluation details.
- Keep screens state-driven and delegate domain behavior to deep modules.

**Consequences**

UI tests should verify visible behavior and navigation, while module tests verify credit math, reportability, evaluation, persona truthfulness, progression, ranking credibility, and voice-provider translation. Raw voice-provider events, Hidden Test Plan structure, credit rounding, Trap selection, and Progression formulas should not appear in UI code.
