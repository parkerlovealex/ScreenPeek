# Phase 1 verification evidence

Results here describe local runs, not GitHub CI or a cloud deployment.

## 1.1 — scaffold

- `npm run build`: passed with Astro 5.18.2 / Cloudflare adapter 12.6.13.
- `npm run typecheck`: passed, 0 errors/warnings/hints.
- Production browser smoke: 1 test passed (system Chromium), viewport 360×800; header 56px; no horizontal overflow; mobile navigation opens; one external CSS file; no external client scripts; reserved 300×250 ad; attribution and loaded logo.
- Dependency audit: failed, including critical/high advisories in the legacy Pages stack. Do not deploy this combination until the hosting/version decision is resolved. Owner approval of a Workers migration is pending; no hosting change has been made.

## Full Phase 1 verification

Not yet run. Task 1.1 is locally verified; later tasks are not complete. GitHub CI, live TMDb/R2 sync, live redirects/cache purge, and cloud deployment have not been verified.
