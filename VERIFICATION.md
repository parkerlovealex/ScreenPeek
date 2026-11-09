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

## 1.14 — search API, suggestions and results

- Actual local D1/API search tests: 9 passed, covering literal-prefix FTS, Unicode, 24+24+2 pagination, filters/sorting, movie/TV ID collisions, visibility/gates, eight-result cap, input/method validation, owned media URLs and failure redaction.
- Production browser suite: 22 passed. Header suggestions make no initial request, support keyboard selection/Escape, and use only the owned endpoint. Full search filters and pagination work without JavaScript; pages stay noindex/no-store.
- Typecheck: 99 files, 0 errors/warnings/hints. Build and source boundary check pass. Browser DOM appends use appendChild to avoid a conflicting Worker HTMLRewriter type overload.
- Counter policy recorded in AGENTS/DECISIONS: owner chose approximate best-effort buffering; no Durable Objects.

## 1.15 — localised watch information

- D1/geo/link checks: 2 passed, covering country selection/fallback, country-specific providers, availability countries, configured-only go links, safe HTTPS destinations and schedules, and disabled KV records.
- Production browser suite: 23 passed, including UK/US provider groups at 360px, JustWatch credit, country switching, no popunder slot, no overflow and unknown-title 404.
- Typecheck: 106 files, 0 errors/warnings/hints. Build and source boundary check pass.
- Empty destinations remain information-only provider rows; no hard-coded provider URLs or fake outbound buttons. Watch responses are currently private/no-store to avoid cross-country cache sharing; country-keyed edge caching is part of 1.23.

## 1.16 — managed redirects and approximate click counts

- Redirect/data tests: 2 passed; watch regression tests: 2 passed. Verified country → device → default precedence, ignored Phase 2 splits, disabled/scheduled/unsafe destinations, no arbitrary URL parameter, prefetch suppression, safe home fallback and redirects surviving logging failure.
- Actual D1 proves 100 same-group events become one buffered group and two batched statements; no synchronous write per redirect. Flushes leave query-budget headroom. Counts are best effort and approximate as approved by the owner.
- Production browser suite: 24 passed. A real Worker redirect returns 302 to the configured UK destination and its count reaches D1 after the five-second buffer, within the healthy-service 60-second target. No external redirect was followed.
- Initial browser run caught an extra trailing-slash 301 and competing test SQLite processes. Internal outbound URLs now use their canonical trailing slash; binding browser tests run with one worker and the complete rerun passes.
- Typecheck: 111 files, 0 errors/warnings/hints. Build, source boundary check, Actionlint and diff whitespace check pass. Live admin creation/redirect verification remains pending credentials and the admin tasks.

## 1.17 — voting and browser-local lists

- Vote API/native D1+KV tests: 2 passed, covering bounded JSON, method/origin validation, title visibility, typed IDs, deferred aggregate writes, daily duplicate markers, hashed IP/title/day keys and movie/TV separation. 100 same-choice votes aggregate into one statement. KV markers are a basic eventually consistent guard; counts remain explicitly approximate.
- Production browser suite: 27 passed. Verdict submission reaches real local D1 after buffering, displays percentages, and stays disabled after reload. Direct repeat submission is rejected. My List toggles from cards/detail, survives reload/removal, and keeps viewing history in localStorage only.
- Stored library text cannot inject HTML or unowned images. Saved-title grids paginate with real URLs at 24 cards; viewing history uses text rows to keep the page at most 24 poster cards. My List is noindex/no-store and contains no ads.
- A browser test found a nullable TMDb vote-count crash on a sparse valid title; the ratings strip now shows an unavailable state. Complete browser rerun passes.
- Typecheck: 120 files, 0 errors/warnings/hints. Build, source boundary check, Actionlint and diff whitespace check pass. Native binding regression tests: 3 passed after adding local KV support. No live cloud voting check is claimed.

## 1.18 — configured ad placements and capped popunder admission

- Native ad-resolution tests: 2 passed. Actual local D1/KV verify placement isolation, schedule bounds, unchanged snippet strings, disabled mirrors, authenticated-only test mode, master switch and cap hours. Platform ADS_ENABLED=0 skips ad storage entirely; watch/popunder is forbidden before any lookup.
- Production browser suite: 29 passed. An isolated real Worker with ADS_ENABLED=1 renders a simulated snippet only in detail/native and a separate global Social Bar. Popunder code is inert until an eligible trusted click, admitted once across reloads and tabs, and skipped when cookies cannot be set, on an interstitial click, or on the Where-to-Watch action. Watch and My List contain no popunder code; My List has no ads. Real provider snippets/delivery remain unverified until the owner supplies them.
- Preview query adtest=1 does not authorize scripts. Native and infeed are distinct list placements; infeed appears between the first 12 and remaining cards. No monetisation destination or provider code is in application source.
- Typecheck: 126 files, 0 errors/warnings/hints. Build, source boundary check, Actionlint and whitespace check pass. After completing grouped-upcoming infeed handling, build and the 9 affected hub/ad browser tests passed again.
- Local migration 002 adds authenticated test-mode state and an off-by-default admin master switch. Mirror keys are ad:<page>:<placement> and config:<key>; static HTML still refreshes only on build, as approved.

## 1.19 — protected core admin

- Native Access/admin tests: 3 passed. Runtime-generated RSA keys verify real signatures; wrong issuer/audience/expiry/email, tampered tokens and email-only spoofing fail closed. D1 roles and module restrictions apply server-side; Viewer cannot write, Ads cannot change general Settings, and explicit module restrictions also constrain Owner. No development login bypass ships.
- Actual local D1/KV verifies optimistic revisions, actor-stamped audit records, rollback when an audit insert fails, exact ad-code mirroring, pending purge status and replay. Pin/hide changes affect public data and lookup counts. Simulated Cloudflare purge and GitHub workflow-dispatch requests use the correct fixed endpoints; sync dispatch requests no deployment.
- Full production browser suite: 30 passed. The admin flow creates a link, verifies its country redirect and buffered click, saves an ad and sees it without a build, restricts test mode to authenticated previews, enforces Viewer/Ads permissions, exports private configuration, and toggles maintenance while retaining admin access. All seven core modules were opened at 360px; the inspected Content screenshot has no overflow or ad code.
- A browser run caught the no-referrer policy turning same-origin form Origin into null. Changed the policy to same-origin; null/cross-origin requests remain rejected. Successful forms now use POST→303→GET with an actor-bound short-lived notice, preventing accidental resubmission on reload.
- Typecheck: 138 files, 0 errors/warnings/hints. Build, source boundary check, Actionlint and whitespace checks pass. After final permission refinement, native tests and the affected admin browser flow passed again. Catalogue regression tests: 2 passed.
- Migrations 003/004 add revisions, delivery records and case-insensitive email uniqueness. Real Access setup, purge, workflow execution and GitHub CI remain unverified without owner accounts/credentials; see docs/ADMIN-SETUP.md. No remote service was changed.
- This is the core admin milestone. The remaining Phase 1 admin tasks still include Undo/purge retry/SEO/meters and global per-format ad switches (1.33), universal lists/homepage-category controls (1.35), title/person editing (1.37), and remaining Settings/Tools including site-logo upload (1.38). Full user-management UI remains Phase 2.

## 1.20 — editable trust pages and styled unknown routes

- Native trust/Markdown tests: 2 passed. Real D1 defaults and manual edits render; unknown page keys are constrained; unavailable content gives 503 while the 404 fallback retains 404. Raw HTML and dangerous protocols are disabled, and Markdown cannot introduce inline images.
- The full browser run passed 35 checks and caught a test locator timeout on a prefilled textarea. Using its accessible textbox name fixed the selector; all 6 affected trust/editor checks then passed. All four trust pages were checked at 360px, plus unknown single/nested routes with actual HTTP 404, site chrome and Go home links.
- The authenticated Editor saves Markdown into D1 with its Access email in admin_log; the public page shows the edit without executing pasted HTML. Mandatory About attribution remains outside editable content. Trust pages/404 include no ads or popunder.
- Typecheck: 144 files, 0 errors/warnings/hints. Build, source boundary check, Actionlint and whitespace check pass. Added exact micromark 4.0.3 as a server-only parser; dependency audit reports 0 vulnerabilities.
- Migration 005 initializes editable About/Privacy/DMCA/Contact/404 content without replacing existing pages. Public contact details are visibly unconfigured; the owner was asked for a public email or permission to retain placeholders. No email address or form delivery is invented. 404 logging remains task 1.29; static generation remains 1.23.

## 1.21 — search metadata and dynamic sitemap gates

- Native SEO/D1 tests: 2 passed. Verified canonical host safety, clean pagination/filter/country variants, safe JSON serialization, Movie/TVSeries/Person/TVSeason/TVEpisode/VideoObject mappings, no aggregateRating/Review, and no invented trailer upload date.
- Actual D1 sitemap checks cover visible/gated title admission, hide/delete/Trash/SEO exclusions, eligible people/taxonomy, and 10,003 titles split into 10,000 + 3 URLs. Preview/sample modes emit empty sitemaps; database failure returns 503. Generated XML uses stored last-modified dates and 24-hour shared-cache headers; production cache deployment remains unverified.
- The full browser run passed 37 checks and exposed overlapping mixed-parameter sitemap routes returning 404. Consolidated sitemap shards behind one validated handler; both affected SEO browser checks then passed, including production-mode robots/XML, gated versus ungated indexing, canonicals and structured metadata. A separate native failure caught D1's compound-SELECT limit; the general-pages query now uses a VALUES CTE and passes.
- Final typecheck: 151 files, 0 errors/warnings/hints. Build, source boundary check, Actionlint and whitespace check pass. Production indexing requires the real SITE_URL plus DEPLOYMENT_ENV=production; previews default to noindex and disallow-all robots, independently of ads.
- OG/Twitter use owned images when available and omit missing images. Generated social cards remain 1.30; visible Q&A/FAQ schema remains 1.27. Trailer titles retain honest wording rather than asserting unverified official status. Google rich-result validation and live crawler/cache checks have not run.

## 1.22 — guarded deployment preparation and interim verification

- Added DEPLOY-CHECKLIST.md with owner steps, current Workers commands, binding/secrets separation, Access, image-domain and contact requirements, rollout switches, rollback and the approved static-save distinction. Production preparation wires public account/D1/KV/R2 metadata, preserves platform variables, defaults ads off and excludes credential values. It does not provision resources.
- Deployment tests: 3 passed. Placeholder IDs/unsuitable URLs/plaintext secret vars fail; invalid settings preserve the build; an incomplete Phase 1 checklist prevents Wrangler from starting. Deployment additionally requires the owner's enable flag and API token. The nightly step uses this guard.
- Wrangler offline dry run passed with the current Worker and DB/CONFIG/POSTERS/ASSETS bindings, seven client assets and about 269 KiB compressed Worker upload. No real resource existence, token permission or deployment is claimed.
- Clean npm ci and the complete current local CI sequence passed: typecheck (154 files, 0 errors/warnings/hints), boundary guard, 125 native/integration tests, build, 38 production-browser tests, Actionlint and audit (0 vulnerabilities). Hosted CI is unrun.
- Measured fresh 360×800, cache-disabled, no-scroll Resource Timing transfer: Home 14,341 B, detail 15,154 B, Watch 13,325 B. These are explicitly placeholder-poster measurements; they do not verify the real-image budget or Lighthouse gate.
- Every prompt verification item is reported in docs/PHASE1-CHECKPOINT.md as local pass, partial, pending or blocked. This checkpoint precedes tasks 1.23–1.38, so the full verification must repeat after their completion. Real TMDb/R2/Access/ads/purge/CI/deployment checks remain blocked by missing owner setup; no false live result is marked passed.

## Deferred deployment verification

- **1.26:** Code complete; live custom-domain verification deferred to the deployment phase (owner deferred domain purchase; deployment setup is handled separately after Phase 1).
- Owner chose ScreenPeek.io; no domain has been purchased or connected. Continue local Phase 1 work and append any account/domain/credential-dependent verification here.

## 1.27 — detail originality

Stored metadata produces the facts line, three visible Q&A answers, matching FAQPage schema, and a valid Updated date. Missing fields use honest unavailable wording. No third-party aggregateRating or Review markup is added. Typecheck and two SEO tests pass; four detail/originality browser tests pass. First-screen transfer remains below 100 KB: home 46.27, detail 68.88, list 46.28, watch 24.00 KB.

- **1.28 deployment check deferred:** install and verify custom-domain filter-query redirect/X-Robots-Tag rules described in docs/FILTER-URL-RULES.md. Generated dynamic filter routes are locally available; static-root query compatibility requires that domain rule.

## 1.28 — filter URL controls

51 catalogue tests, two SEO tests, six browser checks and typecheck pass. The production-mode fixture verifies filtered pages are noindex, canonical to the clean hub, and private/no-store. Clean pagination/no-JavaScript forms pass. Live custom-domain compatibility for old manually entered static-root query URLs is deferred to deployment; see docs/FILTER-URL-RULES.md.

## 1.29 — route policy

Two route-policy tests pass against actual local Worker/D1: stored redirect returns 301 before rendering, owner-deleted title returns 410, and a styled unknown route is logged after a five-second approximate batch. Targets stay on the owned origin and exclude privileged/outbound routes; path logs exclude query strings and are bounded to 1000 stored paths / 40 pending paths. Static build excludes redirect source paths, so static changes apply on the next build as approved. Build and typecheck pass. Live CDN refresh remains deferred to deployment.

## 1.30 — generated social cards

Ten image tests and all 21 sync integration tests pass. The importer creates owned OG keys for 50 gated fixture titles, with no duplicate titles or unchanged-source image re-downloads on rerun. Encoded cards are 1200×630 WebP with immutable headers, escaped stored text, deterministic keys and current field-lock checks. Owned R2 posters are reused when metadata changes. One browser test verifies gated OG URL and dimension tags. Build/typecheck pass. Live R2 URLs and social crawler fetching remain deferred to deployment.
