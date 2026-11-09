# Phase 1 verification evidence

Results here describe local runs, not GitHub CI or a cloud deployment.

## 1.1 — scaffold

- `npm run build`: passed with Astro 7.4.7 / Cloudflare adapter 14.4.6, Workers output.
- `npm run typecheck`: passed, 0 errors/warnings/hints.
- Production browser smoke: 1 test passed (system Chromium), viewport 360×800; header 56px; no horizontal overflow; mobile navigation opens; one external CSS file; no external client scripts; reserved 300×250 ad; attribution and loaded logo.
- `npm run test:scaffold`: 1 passed against production Workers preview after migration.
- Initial dependency audit on the legacy Pages stack failed. Owner approved Workers migration; `npm audit --audit-level=high` now passes with **0 vulnerabilities**.
- Generated configuration has `assets.run_worker_first=false` and DB/CONFIG/POSTERS bindings; all cloud IDs remain placeholders. Workers compatibility date is 2026-11-08, supported by the installed emulator.
- Geo in the local emulator uses placeholder metadata; production geo and deployment are not verified.

## Full Phase 1 verification

Not yet run. See the individual task sections for local verification. GitHub CI, live TMDb/R2 sync, live redirects/cache purge, and cloud deployment have not been verified.

## 1.2 — local D1 and removable fixtures

- Base schema matches `templates/schema.sql` byte-for-byte; 39 statements applied to actual local D1.
- Development seed: 50 synthetic titles (30 movies, 20 series), 12 people, 40 seasons, 120 episodes, provider data for US/GB/CA/AU and empty-state examples. Images remain null and quality gate remains 0 until an image exists.
- `npm run test:database`: 1 integration test passed against isolated actual local D1. Seed twice yields 50 fixtures; FTS finds 50; manual fixture edits survive; removal preserves an unrelated title and its FTS row; reseeding restores fixtures; a reserved-ID collision is rejected before altering existing rows.
- Production Workers browser tests: 2 passed at 360px. The real bound D1 returns 50 titles to the homepage; the browser sends no external requests.
- No remote D1 was created, seeded, or accessed. Owner chose local placeholders first.

## 1.3 — sync-only TMDb client

- `node --test tests/tmdb.test.ts`: 17 passed, 0 failed/skipped. All requests use injected simulated responses; no live API or credentials were used.
- Verified Bearer/v3 authentication, bundled endpoints, pagination, five-request cap through response-body completion, Retry-After seconds/date and exponential backoff, retry exhaustion, transient errors, non-retried 401s, invalid JSON, input validation, and credential redaction.
- `npm run typecheck`: 16 files, 0 errors/warnings/hints.
- Live key/authentication and real TMDb behaviour remain unverified, per the owner's local-placeholder choice.
