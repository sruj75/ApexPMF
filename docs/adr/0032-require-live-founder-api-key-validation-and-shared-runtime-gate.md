# Require live Founder API Key validation and a shared runtime gate

First-run onboarding requires a **Founder API Key** and does not allow skip in v1. The feature-tour API-key step is blocked until a live Gemini validation succeeds, with explicit distinction between invalid credentials and transient provider/network failures. After onboarding, all Gemini-dependent actions reuse one shared domain guard (`missing key`, `invalid key`, `transient failure`) instead of duplicating route-specific checks. Key storage remains account-scoped with encrypted/reversible runtime storage, plus validation metadata (`validation_status`, `last_validated_at`) for truthful UX and simpler operations.

