# Use LLM-as-judge for Hidden Evaluation in v1

Hidden Evaluation will use a non-live LLM judge after Session end as the primary evaluation mechanism for Interview Behavior. Deterministic keyword/rule scoring is not the evaluation source of truth.

The judge evaluates the Learner's Voice Conversation from the completed Session Transcript plus internal Generated Session Case context and returns structured evaluation artifacts for Session Report and downstream Progression.

**Considered Options**

- Keep deterministic rule-based Hidden Evaluation as the primary scorer.
- Use a hybrid where deterministic scoring and LLM scoring both contribute to behavior outcomes.
- Use LLM-as-judge as the primary evaluator with schema-constrained outputs.

**Consequences**

Hidden Evaluation quality can capture conversational nuance that rigid rules miss, including cases where a high-quality outcome is discovering non-customer fit. The evaluation remains hidden and post-session, so there is no live coaching leakage during Voice Conversation.

The system still requires strict structured outputs and evidence references so report generation and persistence remain reliable. If the judge output is invalid after a limited repair attempt, the flow should return insufficient-evidence rather than fabricate coaching.
