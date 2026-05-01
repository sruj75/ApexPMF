# Let domain modules own non-live LLM boundaries

Persona Generation, Hidden Evaluation, and Report Builder will each own their own non-live LLM prompts, schemas, parsing, retries, and domain validation. A shared low-level LLM client may handle transport concerns such as API execution, keys, logging, and timeouts, but there should not be one vague AI service that owns all generation, evaluation, and reporting behavior.

**Considered Options**

- Put all non-live model calls behind one generic AI service.
- Duplicate HTTP/API plumbing inside every domain module.
- Share low-level transport while keeping prompt and schema ownership inside each domain module.

**Consequences**

Model-call behavior should be reviewed in the context of the domain module it serves. Tests should verify persona quality, evaluation behavior, and report output through those module boundaries, while low-level client tests focus only on transport concerns.
