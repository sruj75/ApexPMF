# Use Gemini Live as the v1 voice default behind Voice Runtime

Gemini Live API will be the v1 default for Voice Conversation, but it will sit behind the Voice Runtime boundary. The goal is simple implementation with one real provider path while keeping Gemini event shapes out of Session Orchestrator, UI, reports, and domain tests.

**Considered Options**

- Commit Gemini details directly throughout Session and UI code.
- Build a broad multi-provider voice abstraction before v1 proves it needs one.
- Use Gemini directly through a small Voice Runtime boundary.

**Consequences**

Voice Runtime should translate Gemini events into domain Session events and own interruption, latency, transcription, persona speech, and voice failure behavior. The boundary should stay small; provider-switching abstractions are unnecessary until there is a concrete product or operational reason to add them.
