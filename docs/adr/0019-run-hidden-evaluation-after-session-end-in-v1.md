# Run Hidden Evaluation after Session end in v1

Hidden Evaluation will run after the Session ends in v1, using the structured Session Transcript and Generated Session Case. It remains hidden because it does not provide live coaching or in-session hints, not because it must run concurrently during the Voice Conversation.

**Considered Options**

- Evaluate continuously during the live voice loop.
- Evaluate only after Session end.
- Preserve cheap structured voice signals during the Session but defer actual evaluation until after Session end.

**Consequences**

The live voice path stays simpler and easier to reason about. Evaluation becomes more auditable because it runs over a completed structured transcript and preserved persona truth. If Gemini Live provides useful low-cost signals, Voice Runtime may preserve them as metadata without turning them into live coaching or live evaluation decisions.
