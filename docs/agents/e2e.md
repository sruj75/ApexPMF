# End-to-end testing

## CI (public smoke only)

GitHub Actions runs Playwright **without Google OAuth**. Specs in [`e2e/public-smoke.spec.ts`](../../e2e/public-smoke.spec.ts) cover:

- Landing, login, and signup pages
- Unauthenticated redirects from `/dashboard` and `/practice` to `/login`

Commands (after `npm run build`):

```bash
npx playwright install chromium
npm run test:e2e
```

## Local authenticated journey (not in CI)

Google OAuth cannot run headlessly in CI. For **auth → practice → report**, use a real Supabase project and local `.env.local`.

1. Copy [`.env.local.example`](../../.env.local.example) to `.env.local` and fill Supabase keys.
2. `npm run dev` — sign in with Google once in the browser.
3. Save session storage (optional):
   ```bash
   npx playwright codegen http://localhost:3000/dashboard --save-storage=e2e/.auth/user.json
   ```
4. Run authenticated spec:
   ```bash
   E2E_RUN_AUTHENTICATED=1 npm run test:e2e -- e2e/authenticated-journey.spec.ts
   ```

`e2e/authenticated-journey.spec.ts` is skipped unless `E2E_RUN_AUTHENTICATED=1`. It expects `e2e/.auth/user.json` (gitignored) or `E2E_STORAGE_STATE`.

## Environment

E2E uses the same placeholder public Supabase env vars as CI build when secrets are absent. Authenticated flows require valid Supabase and founder data.
