# PRD — Movie System (Tier-1 Movie/TV Information Website)

Version 1.2 · 2026-11-09 · Owner: Karn · Status: approved plan, build in phases (v1.1 = review round: hybrid static tier, CI speed gate, schema-honesty fix, OG cards, poster colour, admin purge/undo/SEO tab — FEATURES #22–34 · v1.2 = full admin suite: 16 modules with universal list powers, trash, scheduling, roles — spec in `docs/ADMIN-PANEL.md`, FEATURES #35)

## 1. Product summary

A legal movie & TV information website for Tier-1 English audiences (US, UK, CA, AU), monetised with Adsterra ads and streaming affiliate links. A daily automated sync imports new/changed titles from TMDb into our own database and image storage, so visitors are always served from our own ultra-light pages and never trigger an API call. A production-level admin panel controls every link, ad code and content pin without touching code.

**Business goal:** maximum sustainable profit = high traffic × high counted impressions per session × Tier-1 rates, at $0 hosting/bandwidth cost while on Cloudflare free tiers.

**Non-goals:** no downloads or streaming of pirated content; no user accounts; no comments/forums; no mobile app; no paid traffic in v1.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Audience | Tier-1 English (US/UK/CA/AU), country auto-detected per visitor (Cloudflare geo) |
| Content source | TMDb API — free key for the test phase (owner accepts the licensing risk knowingly; architecture keeps the source swappable) |
| Ratings strip | TMDb score always; IMDb/RT/Metacritic via cached OMDb lookups, behind a feature flag (default OFF until owner enables) |
| Hosting | Cloudflare Pages (free) — commercial use allowed, unlimited bandwidth. Astro keeps a later move to Vercel Pro possible but it is NOT the target |
| Sync cadence | Once daily (GitHub Actions cron, after ~08:00 UTC), plus manual trigger from admin |
| Monetisation | Adsterra (300×250, native, sticky 320×50, Social Bar, popunder capped 1/session) + Smartlink buttons via Link Manager + streaming affiliates on Where-to-Watch |
| Language | English UI; per-country release dates/certifications where TMDb provides them |

## 3. Users

- **Visitor** (mobile-first, ~80%+ mobile): arrives from Google/social/Telegram; browses posters, opens a detail page, checks cast, checks where to watch; may save titles to My List (browser-local).
- **Owner/Admin** (Karn): manages links, ad codes, pins, settings and sync from `/admin` (Cloudflare Access login).

## 4. Functional requirements

### 4.1 Public site — see `docs/ROUTES-AND-DESIGN.md` for the full route map and page anatomy, `docs/FEATURES.md` for the phased feature list with acceptance criteria.

Core behaviours:
- Poster-card grids everywhere (badge spec in design doc), 24 per page, numbered pagination.
- Live search suggestions (header) querying `/api/search` (D1 FTS5); full results at `/search/`.
- Detail pages for movies and TV; TV has season pages and episode lists.
- Cast/person pages whose filmography loops visitors into more detail pages.
- Where-to-Watch page per title, localised to the visitor's country (fallback: US), with affiliate-ready outbound links routed through `/go/<slug>`.
- Community Verdict voting (anonymous, one vote per device per title, stored via `/api/vote`).
- My List + recently viewed, stored in `localStorage` only.
- Every content page is a separate route (no tabs) and carries the standard ad slots for its page type (see `docs/ADS-AND-ADMIN.md`).

### 4.2 Daily sync — see `docs/SYNC.md`.
Changes endpoints + trending/now-playing/upcoming → filter (popularity + metadata completeness) → bundled detail fetch → upsert D1 → copy poster/backdrop to R2 as WebP (w185 + w500) → refresh sitemap data → write sync log → Telegram alert on failure. Manual "Run sync now" from admin triggers the same GitHub Actions workflow.

### 4.3 Admin panel — full spec in `docs/ADMIN-PANEL.md` (16 modules); money-map summary in `docs/ADS-AND-ADMIN.md`.
Dashboard, Link Manager (CRUD + country/device rules + A/B split + click counts), Ad Manager (code per placement × page type, ON/OFF), Content (pins, homepage order, collections, hide title), Sync (status, run-now, API plug settings), Stats (Adsterra Publisher API), Settings, Backup (export/import JSON).

### 4.4 Link redirect service
`/go/<slug>` (Pages Function): look up link in KV → apply country rule → device rule → A/B split → log click (batched to D1) → 302 to destination. Unknown/disabled slug → 302 to home. This is the ONLY way outbound monetised links are emitted in templates.

## 5. Non-functional requirements

- **Performance/bandwidth:** first-screen own bytes ≤ ~100 KB (see AGENTS.md rule 2); LCP driven by a single small poster; pages usable on slow 3G.
- **Cost:** $0/month on Cloudflare free tiers at launch; design must not require a paid service. First expected paid step: Workers Paid $5/mo when dynamic requests exceed 100k/day.
- **Scale:** catalogue 100k+ titles via the hybrid model (nightly static tier for hubs + top titles under a 15,000-file safety cap; on-demand render + edge cache for the long tail).
- **SEO:** keyword slug URLs (`/movie/<slug>-<year>/`), unique meta/OG per page, sitemap index split by type, only index pages passing the quality gate (popularity + poster + overview + providers or cast). No hash-ID URLs.
- **Reliability:** if D1 read fails, serve stale cache; if sync fails, site keeps serving yesterday's data and admin shows the failure.
- **Security:** admin behind Cloudflare Access; all secrets in env; no TMDb token in client code; `/go` must not become an open redirect (slugs resolved only from KV data).

## 6. Success metrics (owner reviews weekly in admin Stats)

- Impressions and revenue by page type (which journey step earns most)
- Pages/session (target ≥ 5) and Where-to-Watch click-through
- Sync success rate and titles added/day
- Bandwidth: own bytes/page (target ≤ 100 KB first screen) — hosting bill stays $0

## 7. Phases

- **Phase 1 (MVP):** repo scaffold, D1 schema, sync v1, Home/List/Detail/Season/Cast/Watch/Search pages, poster pipeline, ad slots with placeholder codes, Link Manager basic + `/go`, verdict + My List, admin (Dashboard/Links/Ads/Content/Sync/Settings), trust pages, SEO basics, deploy to Cloudflare Pages.
- **Phase 2 (Growth):** geo/device/A-B link splits, admin Stats via Adsterra API, Telegram auto-posting of new titles, provider landing pages (`/on/<provider>/`), per-country release/certification display, optimisation pass.
- **Phase 3 (Scale):** push notifications (new episode / now-streaming), trivia step page, sitemap/SEO hardening at catalogue scale, Workers Paid upgrade path if quotas approach.

## 8. Risks & open items

- TMDb free key is not a commercial licence — owner decision, revisit if the site earns. Mitigation: API layer isolated in `sync/` + one admin setting (the "plug"), so a licensed key or new source swaps in without touching the site.
- Adsterra placeholder codes until owner creates placements; each page type needs its OWN placement code or stats merge.
- Site name chosen: **ScreenPeek** (`screenpeek.io` — purchase deferred by owner decision). Develop/deploy on `*.pages.dev`; connect the custom domain when bought.
- Free-tier quotas are the ceiling (see AGENTS.md); the audit prompt checks the design against them.
