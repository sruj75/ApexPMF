# Ship v1 as a modular Next.js app

V1 will ship as a single Next.js app with explicit internal domain modules rather than separate deployable services. Persona Generation, Voice Runtime, Hidden Evaluation, Report Builder, Credits, Progression, and repository/data-access code should stay modular in code but live inside one deployable application for the initial product.

**Considered Options**

- Split major modules into separate services early.
- Keep most behavior inside UI routes and components.
- Build a modular monolith: one Next.js app with strong internal boundaries.

**Consequences**

The product avoids early deployment, auth, versioning, observability, and distributed failure complexity while preserving clear module ownership. Service extraction should require concrete product or operational pressure, not a speculative architecture preference.
