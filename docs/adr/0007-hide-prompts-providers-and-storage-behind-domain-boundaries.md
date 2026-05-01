# Hide prompts, providers, and storage behind domain boundaries

Prompt wording, model/provider details, voice-provider event schemas, scoring artifact formats, and storage schemas will be treated as private implementation details. The current implementation direction is Next.js, Supabase, Gemini Live API for voice, and normal LLM API calls for non-live generation and evaluation, but domain modules should expose product concepts rather than provider-specific payloads.

**Considered Options**

- Let application and UI code branch directly on provider events, prompt outputs, and database row shapes.
- Snapshot prompt text and provider payloads in tests as the main correctness signal.
- Hide provider and prompt mechanics behind domain modules, then test externally visible domain behavior.

**Consequences**

Voice Runtime should translate Gemini Live details into Session events. Persona Generation, Hidden Evaluation, and Report Builder should hide prompt construction and model response parsing. Persistence code should translate Supabase records into domain objects. Tests should assert Customer Persona behavior, Session lifecycle, reportability, Trap Results, Credits, Progression, and privacy behavior rather than exact provider payloads or prompt text.
