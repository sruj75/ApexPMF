# Check Credits before, during, and after Sessions

Credits will participate before, during, and after a paid Session, but each moment has a narrow responsibility. Before start, Credits decides whether the Learner may begin and provides an estimate; during the Session, it exposes a simple remaining-time or exhaustion signal; after the Session, it finalizes actual duration, rounding, failed-voice refunds or non-charges, and usage records.

**Considered Options**

- Check Credits only before starting a Session.
- Let Credits control the live Session flow directly.
- Use Credits at three moments while keeping Session Orchestrator responsible for lifecycle coordination.

**Consequences**

Credits should not show UI modals, control persona behavior, or decide reportability. Session Orchestrator may react to a Credit Exhaustion signal as an end reason, but credit math and fair failure handling stay inside Credits.
