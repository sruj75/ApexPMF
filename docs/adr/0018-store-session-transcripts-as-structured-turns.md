# Store Session Transcripts as structured turns

Session Transcripts will be stored as structured turns with speaker, order or timestamp, text, and useful voice or failure metadata. Plain text or rendered transcript views may exist for convenience, but they are not the source of truth.

**Considered Options**

- Store only a plain text transcript.
- Store audio as the primary record.
- Store structured transcript turns as the durable transcript record.

**Consequences**

Expandable Evidence can point to precise transcript turns, report generation can use reliable conversation structure, and audit/review flows can inspect evidence without parsing plain text. The Session Report remains the primary coaching surface; the transcript is supporting evidence.
