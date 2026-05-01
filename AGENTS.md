# Agent Instructions

The Mom Test Simulator is a voice-first customer discovery practice product where a Learner interviews fresh LLM-generated Customer Personas and receives post-session feedback.

## Start Here

- `PRD.md` is the product source of truth.
- `CONTEXT.md` defines domain language. Use these terms in issues, code, tests, and docs.
- `ARCHITECTURE.md` defines system shape, runtime boundaries, and current stack assumptions.
- `SOFTWARE.md` defines implementation doctrine, module ownership, and complexity rules.
- `DESIGN.md` defines UI style and visual guidance.
- `docs/adr/` records durable architecture and software-design decisions.

## Repo Rules

- Keep v1 simple: one modular Next.js app, 100% TypeScript, Effect at meaningful boundaries, Supabase behind repositories, Gemini Live behind Voice Runtime.
- Respect the deep module boundaries in `SOFTWARE.md`; do not leak prompts, provider events, Supabase rows, hidden test-plan details, or progression rules into UI code.
- Customer Personas are LLM-generated fresh per Session. Ideal Customer Profiles and Broad Practice Pool seeds steer generation; they are not fixed persona fixtures.
- Before changing product behavior, check relevant ADRs and either follow them or explicitly call out the contradiction.

## Agent Skill Docs

- Issue tracker: `docs/agents/issue-tracker.md`
- Triage labels: `docs/agents/triage-labels.md`
- Domain docs workflow: `docs/agents/domain.md`
