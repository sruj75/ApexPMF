# Manage Hidden Evaluation prompts outside repo

Hidden Evaluation prompt iteration will be managed outside the source repository (for example via Langfuse prompt tooling) rather than as repository-versioned prompt files.

The repository still defines the domain contract for evaluation artifacts and boundary behavior, but prompt copy/iterations are operational assets managed in the prompt tooling layer.

**Considered Options**

- Keep prompt text versioned directly in the repository under domain prompt files.
- Keep a repository file as primary and mirror to prompt tooling.
- Use prompt tooling as primary source of truth and keep repo focused on contracts/boundaries.

**Consequences**

Prompt iteration speed improves without forcing source-code refactors for every evaluation wording change. The codebase remains focused on durable domain contracts, typed schemas, and application boundaries.

This choice requires strong contract validation at the boundary so prompt changes cannot break persistence, report generation, or learner-safe rendering.
