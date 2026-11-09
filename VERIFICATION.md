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

## 1.7 — CI and daily/manual workflow

- Actionlint 1.7.12: both workflows pass with no findings. Its official release archive was checked against the published SHA-256 checksum before use.
- Daily workflow is `nightly.yml`, as specified by the pasted Phase 1 prompt; no duplicate `sync.yml` cron is installed. It schedules 08:30 UTC (14:30 in Asia/Dhaka) plus dispatch, and validates targeted IDs without shell evaluation.
- Remote sync and deployment are independently disabled until the owner sets their explicit repository enable variables. No remote resources or runs were triggered.
- Clean `npm ci` and current CI command sequence passed locally: typecheck (44 files, 0 errors/warnings/hints), source boundary check, 27 sync tests, 9 image tests, 21 sync integration tests, 1 database test, build, and 2 production browser tests. Total: 60 passing tests, no failures/skips.
- Negative boundary probe rejected a visitor-side TMDb API URL. Browser tests used installed system Chromium locally; GitHub workflow installs matching managed Chromium.
- GitHub-hosted CI is **unrun**, not claimed green. Static-tier and speed gates are added at tasks 1.23/1.24; backup belongs to 1.34.

## 1.8 — Home and movie/series catalogues

- Actual D1 catalogue tests: 2 passed, covering 24+6 pagination, filters, sample gating, hidden/deleted/trash exclusion, safe inputs and owned-media URL handling.
- Production browser tests: 6 passed at 360px. Home/movies/series have no horizontal overflow, at most 24 poster cards, one stylesheet, explicit image dimensions, and no source API/image requests. Filters, numbered links and out-of-range 404 work with JavaScript disabled.
- Found and fixed an HTTP 200 on the styled out-of-range state: route loaders now set status/cache headers before rendering components. Regression test passes.
- Typecheck: 55 files, 0 errors/warnings/hints. Build and source boundary check pass. Mobile screenshots inspected; header 56px, catalogue grid 3 columns.
- CSS output: 10,406 bytes minified, 2,784 bytes gzip. No first-screen or Lighthouse claim yet (task 1.24). Images in browser checks are placeholders; real image pipeline was tested separately.

## 1.9 — movie and TV detail pages

- Detail D1 tests: 9 passed, covering relationships, country fallback, cached external ratings flag, malformed JSON, similar-title gating, visibility/404/410 precedence and explicit 503 failures.
- Production browser suite: 9 passed, including movie/TV details at 360px, action links, page anatomy, TV seasons, no overflow, one stylesheet, no embeds/external requests, and actual styled unknown-title HTTP 404.
- Typecheck: 63 files, 0 errors/warnings/hints. Build and source boundary check pass. A ratings type inference issue was caught and fixed with an explicit external-ratings interface.
- Voting/My List are visibly disabled preview controls until task 1.17; no false functionality or broken submission is claimed. Facts/Q&A/updated-date enhancement remains task 1.27; provider logo strip remains 1.32. No JSON-LD yet (1.21).

## 1.10 — TV seasons and episodes

- Actual local D1 tests: 7 passed, covering ordering/navigation, specials, 24+3 episode pagination, canonical integer paths, parent visibility/410 priority, cache/index policies and explicit query failures.
- Production browser suite: 10 passed, including series → season → episode at 360px, episode information, previous/next links, no embeds/external content calls, no overflow, one stylesheet and styled unknown-episode HTTP 404.
- Typecheck: 70 files, 0 errors/warnings/hints. Build and source boundary check pass. Episode route hierarchy is documented.

## 1.11 — person pages and filmographies

- Actual local D1 tests: 8 passed, covering roles/deduplication, movie/TV ID collisions, 24+6 pagination, visibility/gating, missing/deleted people, cache/index policies and failures. A final media-type sort key makes ID/popularity ties deterministic.
- Production browser suite: 11 passed, including title → cast → filmography at 360px, owned-data cards, no overflow/external requests and styled unknown-person HTTP 404.
- Typecheck: 75 files, 0 errors/warnings/hints. Build and source boundary check pass. Biography uses native expansion; no client script or runtime source request was added.

## 1.12 — taxonomy and discovery hubs

- Actual local D1 hub tests: 8 passed, covering genre/language/manual collection membership, overrides/hidden paths, binding safety, ordering, future-only upcoming data, Top10 cap, pagination, gating/cache and failures.
- Production browser suite: 18 passed, including all six hubs at 360px, language page3, styled missing taxonomy and canonical type aliases. Every poster grid remains at most 24 cards; Top10 is a ten-item ranked list.
- Typecheck: 86 files, 0 errors/warnings/hints. Build and boundary check pass.
- Local six-title sample collection added without taking ownership of pre-existing unowned data. Migrated seed/removal test passed again, preserving unrelated references.

## 1.13 — click-to-load trailer

- Actual local D1 trailer tests: 6 passed, covering strict keys, movie/TV lookup, visibility/status, missing-key indexing/cache and failures.
- Production browser suite: 20 passed. Trailer-specific checks confirm zero YouTube requests/iframes before clicking, then an iframe only after the explicit click; its external response is simulated. Missing trailers show no fake player; unknown title returns 404.
- Loader is 871 source bytes, no third-party thumbnail/preconnect, reserved 16:9 frame, normal YouTube-link fallback without JavaScript. Test key is temporary on an owned negative-ID fixture and restored after the test.
- Typecheck: 91 files, 0 errors/warnings/hints. Build and source boundary check pass. No real external video was requested in tests.
