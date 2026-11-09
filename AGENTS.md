# AGENTS.md — Movie System (project brain)

**Owner-approved update (2026-11-09):** hosting is now **Cloudflare Workers with static assets**, replacing Cloudflare Pages/Pages Functions. The owner approved this because maintained Astro adapters have removed Pages support and the legacy Pages stack has critical/high dependency advisories. Astro, TypeScript, D1, KV, R2, GitHub Actions, the static-first model and all numbered HARD RULES remain. Use current Workers deployment commands rather than the original Pages commands below or in the supplied docs. See `docs/DECISIONS.md` for the approved static-save behaviour.

**Owner-approved counter behaviour:** keep best-effort batching and label counters approximate. Durable Objects were declined; do not add them. This supersedes supplied claims that internal click counts are exact; D1 writes remain batched.

Read this first, every session. Full detail lives in `PRD.md` and `docs/`. Build order lives in `TASKS.md`. If any instruction conflicts, this file's HARD RULES win. (This is the Codex edition of the project brain — the rules are identical to the Claude Code edition; only the filename differs, because Codex reads `AGENTS.md` automatically.)

## What this project is

A legal, English, Tier-1 (US/UK/CA/AU) movie & TV **information** website whose business is advertising: Adsterra display/native/Social Bar + a capped popunder + affiliate links on the Where-to-Watch page. It is a *system*, not just a website: a daily auto-sync imports content, an admin panel controls every link and ad code, and pages are engineered to be ultra-light so ads load fast and impressions count.

## Stack (locked — do not substitute without asking the owner)

- **Astro + TypeScript** (static-first, near-zero client JS)
- **Cloudflare Workers with static assets** hosting + Worker routes for the few dynamic endpoints (owner-approved migration)
- **Cloudflare D1** (SQLite) = catalogue database · **KV** = config + links (fast edge reads) · **R2** = poster/backdrop storage (zero egress)
- **GitHub Actions** = daily sync cron + CI + Workers deployment workflow; deploy only when the owner has supplied the necessary account and credentials.
- **Admin auth:** Cloudflare Access in front of `/admin`; app-level roles (Owner/Editor/Ads/Viewer) per `docs/ADMIN-PANEL.md`, which is the full admin spec (16 modules). Every admin mutation writes `admin_log` with the actor's Access email and purges cache on save.
- No traditional backend/server. No WordPress. No Next.js.

## HARD RULES (never break, never "improve" away)

1. **Visitors never call TMDb.** All TMDb access happens inside `sync/` (GitHub Actions, once daily). Pages read only D1/R2/KV.
2. **Bandwidth budget (own bytes, ads excluded):** first screen ≤ ~100 KB total — HTML ~25 KB compressed, one CSS file ~10 KB, client JS ~0–5 KB, only on-screen posters downloaded. Everything below the fold lazy-loads. Card posters = one small WebP (w185 class, ~10 KB). No backdrop/hero images on list pages. System fonts only. Trailer = click-to-load facade (no YouTube bytes until clicked). Max 24 cards per page.
3. **Legal & policy-safe:** information only. No download buttons/links, no fake server or player buttons, no forced-click hijacks, no auto-clicker/fraud-friendly patterns, no misleading UI. This protects the Adsterra account; do not add anything that violates Adsterra publisher terms.
4. **Nothing monetisation-related is hard-coded.** Ad codes, Smartlinks, affiliate/social links, toggles all live in KV/D1 and are edited in `/admin`. Code contains placeholders only.
5. **Popunder discipline:** at most 1 per visitor session (cookie cap, default 24h), never fired on Where-to-Watch outbound clicks, never stacked with an interstitial on the same click.
6. **Separate page per step** (detail, cast, trailer, watch, similar are distinct routes — never tabs), because each pageview is ad inventory.
7. **Attribution:** footer on every page carries the TMDb notice ("This product uses the TMDB API but is not endorsed or certified by TMDB" + TMDB logo) and JustWatch credit wherever provider data appears.
8. **Secrets only in `.env` / platform env vars.** Never commit a key. TMDb token is used server-side (sync/functions) only — never shipped to the browser.
9. **Structured-data honesty:** NEVER put third-party ratings (TMDb/IMDb/RT) into `aggregateRating` or any review markup — Google forbids marking up other sites' ratings and it risks a manual action. The ratings strip is visible UI text only. (A Verdict-based aggregate may be considered in Phase 2+ only from real on-site votes.)
10. **Speed is a build gate:** CI fails if a template's first-screen own bytes exceed ~100 KB; Lighthouse mobile performance target ≥ 90 measured with ad placeholders (real ads are excluded — they're not ours to optimise).

## Rendering model (hybrid — v2)

- **Static (pre-built nightly):** home, list hubs (top10/new/upcoming/genre indexes) and the **top gated titles** (config `static_top_n`, default 3,000, by popularity). Static files are served free and unlimited and never invoke a Function. The nightly GitHub Actions job runs sync → build → deploy. **Hard cap: total static files must stay ≤ 15,000** (Pages limit is 20,000) — the build must count files and fail loudly rather than exceed it.
- **Long tail (everything else):** server-rendered from D1 with long-TTL edge cache headers + stale-while-revalidate, plus a Cloudflare Cache Rule on the custom domain so cached catalogue responses are served without invoking Functions.
- Do NOT pre-build the whole catalogue. Config/links are read from KV at render. Counters (views/votes) are batched, not written per hit.
- **Admin saves purge the cache** (Cloudflare purge API) for affected URLs — ad/config changes purge site-wide — so an edit is live in seconds, not after the TTL.

## Free-tier limits the design must respect

- Pages Functions: 100k requests/day free → cache-first design; dynamic endpoints only for `/go/*`, `/api/search`, `/api/vote`.
- D1: 5M rows read/day, 100k rows written/day, 5 GB → indexed queries, no per-hit writes, edge caching.
- R2: 10 GB free → two WebP sizes per title (~60 KB/title ≈ 160k titles).
- Pages: 500 builds/month → the nightly static refresh (~30/month) fits easily; code deploys stay manual via git push.

## Working style

- Build in the order of `TASKS.md`; finish and verify one task before starting the next; tick the checkbox and report what was verified.
- Prefer the smallest change that satisfies the spec; do not add features that are not in `PRD.md`/`docs/FEATURES.md`.
- After each phase, run the checks in the QA audit prompt the owner pastes (or the phase prompt's verification list) and report results honestly — if a check fails, say so.
- Ask the owner before: changing the stack, adding a paid service, changing a HARD RULE, or anything involving real money/accounts.
