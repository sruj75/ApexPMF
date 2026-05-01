# Make Persona Generation the source of persona truth

`Persona Generation` will be the source of truth for a Customer Persona's hidden backstory, Customer Fit, Traps, Concrete History, and truthfulness contract. Voice Runtime may express hesitation, vague praise, speculation, interruption, discomfort, and other unreliable social signals, but it must not invent false Concrete History outside the Generated Session Case.

**Considered Options**

- Let the live voice model improvise persona facts freely for conversational realism.
- Let Hidden Evaluation reconstruct persona truth after the Session from the transcript.
- Generate persona truth up front, preserve it in the Generated Session Case, and require runtime behavior and evaluation to stay consistent with it.

**Consequences**

Runtime prompts and tests should distinguish social unreliability from factual inconsistency. Hidden Evaluation should assess whether the Learner uncovered the preserved truth, not create new persona facts after the conversation.
