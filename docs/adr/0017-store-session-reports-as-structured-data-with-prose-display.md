# Store Session Reports as structured data with prose display

Saved Session Reports will use structured data as the source of truth, with prose stored or generated as display content for the Learner. Required sections include outcome, missed signals, bad questions, strong questions, Trap Results, skill movement, next practice focus, ICP/source context, light persona label, and Expandable Evidence.

**Considered Options**

- Store only rendered prose or markdown.
- Store only rigid structured fields with no user-facing narrative.
- Store structured report sections as the source of truth while allowing prose display content.

**Consequences**

Progression can consume saved Session Reports without parsing prose, and UI can render reports without knowing hidden persona backstory or Hidden Test Plan internals. Report Builder owns the mapping from evaluation evidence into both structured fields and readable feedback.
