# Phase 1 checkpoint — deployment preparation

Local checkpoint on 2026-11-09. This is the task 1.22 report, before tasks 1.23–1.38. The complete verification list must run again after the remaining Phase 1 work. Nothing has been deployed, pushed, or changed in a remote account.

The clean local CI sequence passed: locked install, local schema/migrations/seed, typecheck, source-boundary guard, **125 native/integration tests**, build, **38 production-browser tests**, Actionlint and dependency audit. Typecheck checked 154 files with no errors/warnings/hints; audit reported 0 vulnerabilities. GitHub-hosted CI is **unrun**, not claimed green.

Current browser-reported own-origin transfer at 360×800, fresh contexts, cache disabled, no scrolling, synthetic data and ad placeholders:

| Page | Encoded response bodies | Browser-reported transfer | Requests |
|---|---:|---:|---:|
| Home | 13,141 B | **14,341 B (14.34 KB)** | 4 |
| Movie detail | 13,954 B | **15,154 B (15.15 KB)** | 4 |
| Watch | 11,825 B | **13,325 B (13.33 KB)** | 5 |

These Resource Timing measurements include reported response-header overhead. They include **no real poster downloads**: Home/detail loaded no image elements and Watch loaded one attribution image. They prove the current placeholder transfer, not the real-image budget. Real-image measurements, the deliberate bloat failure and Lighthouse are task 1.24.

| Prompt verification item | Honest checkpoint result |
|---|---|
| Build + typecheck pass; CI green | **Local pass.** Full local sequence passes; hosted CI has not run. |
| Seeded home/detail/watch; first-screen ≤100 KB | **Local placeholder pass:** 14.34 / 15.15 / 13.33 KB reported transfer. Real posters still unverified. |
| Real TMDb import ≥50 titles with R2 posters; rerun zero duplicates | **Blocked:** no owner token/account/S3 credentials. Fifty-title synthetic importer and rerun pass locally; this is not a live-source test. |
| Admin-created `/go/` live redirect and click within 60 seconds | **Local fixture pass:** real local Worker/D1/KV, country rule, 302 and five-second buffered count. Cloud deployment is unrun. Counts are approximate by owner decision. |
| Admin test ad in correct slot; capped popunder; none from Watch | **Local simulated-code pass.** Admin editing, slot isolation, reload/tab cap, cookie-blocked behaviour, test-mode authorization and watch exclusion pass. Actual network snippets/delivery remain unrun. |
| Verdict persists/percentages; My List survives reload | **Local pass.** D1-backed buffered verdict, daily duplicate guard, browser marker and browser-local list/history tests pass. |
| Styled unknown slug/route, logged 404, ungated noindex and absent from sitemap | **Partial:** styled real 404 and SEO gates pass locally. Logging is pending task 1.29. |
| CI byte-budget gate rejects deliberate bloat; real templates pass | **Pending 1.24.** Current measurements are preliminary and the CI speed gate does not exist yet. |
| Nightly hybrid tier, static count <15,000 and long-tail SSR | **Pending 1.23.** Current catalogue renders through SSR. Offline packaging sees seven client asset files, not the requested static title tier. |
| Admin save/purge visible live within a minute; Undo; duplicate warning | **Partial:** local D1/KV edits are visible and mock purge transport passes; real purge is unconfigured/pending. Undo and complete duplicate-warning checks remain 1.33. Static HTML changes require a build, as approved. |
| Movie + FAQ schema, no aggregateRating; SEO 301; deleted title 410 | **Partial:** safe Movie/TV/etc. schema and no rating aggregate pass. FAQ is 1.27, redirect handling 1.29, editor deletion 1.37. The existing detail loader's 410 precedence has native test coverage. |
| Gated 1200×630 OG card and immutable custom-domain images | **Pending 1.26/1.30.** Native WebP processing/upload metadata tests pass, but no real custom-domain response or generated sharing card is claimed. |

Deployment preparation tests pass: generated public bindings exclude credentials, reject placeholder IDs and unsuitable image URLs, preserve the previous build on invalid settings, and refuse deployment while Phase 1 tasks remain unchecked. Wrangler's offline dry run accepted the current Worker (about 269 KiB compressed) and its DB/CONFIG/POSTERS/ASSETS bindings. No real resource existence, permission, billing or runtime health is established by that dry run.

Owner steps are in [DEPLOY-CHECKLIST.md](../DEPLOY-CHECKLIST.md). Keep remote workflow switches off while local Phase 1 work continues. Contact/DMCA still need public contact details; account secrets must be entered through secure settings, never chat or source files.
