# Keep Hidden Evaluation prompts repo-owned

Hidden Evaluation prompt text is repository-owned and hardcoded in domain prompt modules. The runtime prompt source of truth is in this codebase; there is no external prompt tooling dependency for prompt retrieval.

Prompt updates are handled through normal code changes, tests, and review. Hidden Evaluation contracts and guardrails remain in-repo with the prompt artifacts they depend on.

**Considered Options**

- Manage prompt text in external tooling and fetch at runtime.
- Use external tooling as primary with in-repo fallback.
- Keep prompts fully repo-owned and hardcoded in domain modules.

**Consequences**

Prompt behavior is deterministic relative to the checked-in revision, which improves auditability and removes runtime coupling to external prompt systems. The team can still iterate prompt wording, but each change is an explicit code revision.

This choice slows copy-only iteration compared with external prompt tooling, but it maximizes clarity: one runtime source of prompt truth, one review path, and no policy ambiguity between docs and code.
