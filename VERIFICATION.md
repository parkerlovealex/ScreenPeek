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

## 1.4 — collection, admission and metadata transformation

- `npm run test:sync`: 27 passed, 0 failed/skipped (17 client tests plus 10 collector/transform tests).
- Verified changes pagination, five discovery feeds, failed-gap lookback up to 14 days, manual-reconciliation flag for larger gaps, typed-ID deduplication, freshness/blocklist/deletion filters, deterministic priority and deferred overflow at 2,000 titles.
- Bundled fetches preserve queue-order slug reservation, report 404s without deleting data, reject mismatched IDs, and verify unknown changed-title metadata before admission.
- Verified stable slugs, collision suffixes, 12 cast members, creators/directors, four-country providers, trailers, release metadata and owned-poster quality gating.
- Typecheck: 20 files, 0 errors/warnings/hints. All source responses are simulated; no live import or persistence integration has been claimed yet.

## 1.5 — image processing and S3 uploads

- `npm run test:images`: 9 passed, 0 failed/skipped. Sharp produces real WebP bytes at poster widths 185/500, profile 185 and backdrop 300.
- Verified idempotent HEAD checks, only-missing-variant uploads, changed-path immutable keys, movie/TV ID separation, failure placeholders and immutable cache metadata.
- R2 transport tests verify AWS4 signatures independently with Node crypto, signed content/cache headers, fixed account host, path encoding, 404 versus permissions failures, and redacted errors. Transport responses are simulated; no real R2 upload occurred.
- Typecheck: 24 files, 0 errors/warnings/hints. Dependency audit: 0 vulnerabilities after adding Sharp and aws4fetch.
- Available resources: 32 GiB container memory, 5 CPUs; Sharp uses 2 threads and a 32 MiB cache with input pixel limits. No production custom-domain/cache-header check is claimed.

## 1.6 — persistence and importer integration

- 21 tests passed across HTTP transport, actual local D1/R2 persistence, notifications/logging, importer and migrated-seed checks (some executed in separate commands). No failed/skipped tests in these runs.
- Actual local bindings verify transaction rollback, field locks, stable slugs/creation dates, no resurrection of deleted/blocklisted records, FTS/lookup counts, provider logos, manual collection ownership, season cleanup and persistence after reopening.
- Importer test adds 50 synthetic titles with owned WebP objects and 40 episodes; rerun adds 0 duplicates and downloads no unchanged images. Manual title lock survives. Capped work queues 49 candidates and records partial status. Source failure retains data; 404 hides rather than deletes and clears the retry entry.
- CLI exercised twice with `--local --fixture --init --state .cache/fixture-validation`: first added 50, updated 0, 2,282 reported row writes; rerun added 0, updated 50, 1,715 reported row writes. Migrations were not reapplied on rerun.
- Default `npm run db:setup` ran twice successfully; migrated fixture removal preserves unrelated references.
- Typecheck: 43 files, 0 errors/warnings/hints. Dependency audit: 0 vulnerabilities.
- Real REST rollback/numeric-null bindings, TMDb authentication, S3 upload and Telegram delivery remain unverified. All external HTTP tests use simulated responses; real data checks await owner credentials.
