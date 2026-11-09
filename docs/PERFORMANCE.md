# Phase 1 performance gate

Task 1.24 is verified locally. Hosted CI and real CDN delivery remain unrun.

## Reproduce

1. Use the pinned Node version, `npm ci`, `npm run db:setup` and `npm run build`.
2. Install Chromium (`npx playwright install --with-deps chromium` on CI; the cloud workspace also has `/usr/bin/chromium`). OpenSSL must be available for the temporary local image certificate.
3. `npm run test:performance-gate` verifies that a deliberately bloated **real detail template** makes the actual performance command exit with a byte-budget failure.
4. `npm run check:performance` measures home/detail/list/watch, enforces 100000 transferred bytes and reports mobile Lighthouse performance on home/detail/list. A score below the 90 target also fails the command. CI runs both checks and uploads `.cache/performance/` even on failure.

For diagnostics, `npm run check:performance -- --bytes-only` omits Lighthouse; `--bloat` renders the bloated detail and is expected to fail. The negative test checks the exit status and budget error, so an unrelated startup failure cannot pass it.

## Fixture and measurement

The gate runs the built Worker with isolated native D1/KV/R2, renders static hubs/top detail with the real snapshot pipeline, then serves them with assets first. Watch remains SSR. It uses all 50 sample titles with owned, valid WebP fixtures: approximately 10 KB card posters, 40 KB detail posters, 4 KB portraits, 8 KB gallery images, and 1 KB provider logos. Each title has its own image URL. Images come from a separate local HTTPS origin and its temporary certificate is pinned by public-key fingerprint in the test browser. No remote API/account or advertisement request is needed.

Chrome DevTools Protocol counts transferred response bytes, including headers, for the page origin **and** the owned image origin. Every measurement uses a fresh 360×800 mobile context, disabled browser cache, no scrolling, and waits for network idle. Failed/third-party resource requests and incomplete byte measurements fail the check. Ads remain reserved placeholders. The reports include every counted resource; the first-screen test never removes offscreen downloads from the byte total. Lighthouse uses its standard mobile simulated throttling with the same viewport and placeholder ads.

These are controlled local template measurements with synthetic encoded images. Production poster sizes, CDN delivery and real-user metrics still need live validation after the owner supplies accounts and keys. Hosted GitHub CI has not run.

## Verified results

The owner approved a small image visibility observer as an exception to the allowed-JavaScript list. Eager first-row posters retain their normal source; deferred posters load on intersection and have native noscript image fallbacks. A browser check verifies scrolling loads images and the fallback is visible with JavaScript disabled.

| Template | First-screen transfer | Lighthouse mobile | CLS |
|---|---:|---:|---:|
| Home | 46.12 KB | 100 | 0 |
| Detail | 68.39 KB | 99 | 0 |
| Movies | 46.13 KB | 100 | 0 |
| Watch | 23.93 KB | Not targeted | Not targeted |

The Movies template previously transferred 140.65 KB. The gate now passes every measured template. The deliberately oversized real detail still fails with a nonzero exit status, confirmed by the negative test. All 38 browser regressions, the image-loading check, the deliberate-bloat test, typecheck and workflow syntax checks pass. Reports are generated locally under `.cache/performance/`; the configured hosted CI has not been run.

## Task 1.25 navigation verification

Inline document speculation rules select only owned title cards, with conservative press/tap intent. Supporting browsers may prefetch; other browsers retain normal navigation. Watch and utility pages omit the rules. The CSS fade starts at 0.9 opacity and respects reduced motion. No client JavaScript file was added. Chromium accepted the rules without parser errors, reduced-motion animation was absent, and seven catalogue/detail browser regressions passed. Measured first-screen transfers are 46.27 / 68.53 / 46.28 / 24.00 KB (home/detail/list/watch); Lighthouse mobile is 100/100 on all three targeted templates with CLS 0.
