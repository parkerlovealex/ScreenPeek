# FEATURES — phased list with acceptance criteria

Format: feature → phase → "done when". Phases: P1 MVP, P2 growth, P3 scale.

## Parity features (match the best competitor)

1. **Badge poster cards** — P1 — Done when: every grid uses the shared `PosterCard` (2:3 poster, ★ rating badge top-left, type badge top-right, year, 2-line title, views • time-ago), images are our R2 WebP w185, lazy-loaded below the fold.
2. **Category grid + taxonomy pages** (genre / language / collection / type) — P1 — Done when: each taxonomy has paginated grid pages (24/page) generated from D1, with unique meta titles.
3. **Live search suggestions** — P1 — Done when: typing ≥2 chars in the header shows up to 8 suggestions (poster thumb, title, year, type) from `/api/search` within ~300ms, keyboard accessible, "See all results" links to `/search/?q=`.
4. **Community Verdict** — P1 — Done when: detail pages show Must Watch / Good / Average / Skip voting; one vote per device per title (localStorage + server count), percentages shown after voting; votes stored via `/api/vote` batched writes.
5. **My List + history** — P1 — Done when: "+ My List" toggles on cards and detail pages; `/mylist/` lists saved + recently viewed from localStorage; works fully offline of any account.
6. **Top 10 / Trending / Upcoming / New lists** — P1 — Done when: home sections + `/top10/`, `/upcoming/`, `/new/` pages render from D1 popularity/recency fields updated by sync.
7. **Seasons & episodes** — P1 — Done when: TV detail lists seasons; `/tv/<slug>/season/<n>/` lists episodes (number, name, air date, still thumb w185 if present); episode data updated by sync.

## Better versions of competitor features

8. **Keyword slug URLs + gated SEO** — P1 — Done when: all URLs are `/movie/<slug>-<year>/` style; sitemap includes only quality-gated titles; meta/OG/JSON-LD present per page type (templates in ROUTES-AND-DESIGN). **Schema rule: Movie/TVSeries/Person/TVEpisode/VideoObject allowed; `aggregateRating` with third-party scores is FORBIDDEN (Google policy) — ratings are visible text only.**
9. **Honest ratings strip** — P1 — Done when: strip shows TMDb score labelled "TMDb"; IMDb/RT/Meta slots exist behind the `ratings_external` flag (OFF by default) and are labelled with their real source when enabled. Never rendered as structured-data ratings.
10. **Own poster pipeline** — P1 — Done when: sync stores w185 + w500 WebP copies in R2; no page ever hotlinks `image.tmdb.org` at runtime; missing poster → generated placeholder with title text.
11. **Fully automatic daily import** — P1 — Done when: the system adds new movies/series/episodes daily with zero human action (see SYNC.md), and admin shows last-run stats.

## Only-we-have features

12. **Where to Watch, localised** — P1 — Done when: `/watch/<slug>/` groups providers (Stream / Rent / Buy / Free) for the visitor's detected country (US fallback), each provider row routes via `/go/` when an affiliate link exists, JustWatch credit shown.
13. **Admin Link Manager** — P1 basic (CRUD, ON/OFF, click counts); P2 splits — Done when: every outbound monetised link in templates is emitted as `/go/<slug>`; editing a destination in admin changes the live site within 60s with no deploy; P2 adds per-country destination, per-device destination, and A/B % split.
14. **Admin Ad Manager** — P1 — Done when: ad code is stored per (placement × page type); a global per-format ON/OFF exists; popunder session-cap hours are configurable; pages render placeholders when no code is set (layout must not shift when real codes arrive — reserve fixed-size boxes).
15. **Sync status + alerts** — P1 — Done when: admin Dashboard shows last sync time, titles added/updated, errors; a failed sync sends a Telegram message to the owner (bot token + chat id from env; silently skipped if unset).
16. **Swappable API plug** — P1 — Done when: TMDb base URL + key are single settings (env + admin display); the sync's TMDb client is one module (`sync/tmdb.ts`) — replacing the source touches only that module.
17. **Telegram auto-posting** — P2 — Done when: after each sync, new featured titles are posted to the configured channel (poster + title + link) with a per-day cap and an admin ON/OFF.
18. **Provider landing pages** — P2 — Done when: `/on/<provider>/` (e.g. `/on/netflix/`) lists titles available on that provider in the visitor's country, paginated, SEO-gated.
19. **Per-country release data** — P2 — Done when: detail pages show release date + certification for the visitor's country when TMDb provides them (stored during sync for US/GB/CA/AU).
20. **Push notifications** — P3 — Done when: visitors can opt in; sync triggers notifications for new episodes of followed shows and now-streaming arrivals (service worker; no third-party paid push at launch — use a free-tier provider or defer if none fits; ask owner before adding any paid service).
21. **Trivia step page** — P3 — Done when: `/trivia/<slug>/` shows 3 quick questions generated from stored metadata (year/director/cast) with a results state and a link onward to the detail/watch pages.

## v2 additions (review round, 2026-11-09)

22. **Hybrid static tier (free-limit shield)** — P1 — Done when: home, hub lists and top `static_top_n` (default 3,000) gated titles are prerendered nightly (sync → build → deploy); build fails if static files would exceed 15,000; everything else is SSR + edge cache per ARCHITECTURE.
23. **Speed gate in CI** — P1 — Done when: CI measures first-screen own bytes for home/detail/list templates (ads as placeholders) and **fails the build over ~100 KB**; Lighthouse mobile performance ≥ 90 target reported on the same templates.
24. **Instant-feel navigation** — P1 — Done when: list/detail pages include Speculation Rules (inline JSON, no JS file) prefetching linked detail pages on hover/tap intent; page content has a soft CSS fade-in; total JS budget unchanged.
25. **Production image serving** — P1 — Done when: R2 is served via a custom domain (e.g. `img.<domain>`, never r2.dev in production) with `Cache-Control: public, max-age=31536000, immutable`; every `<img>` carries explicit width/height (or aspect-ratio) so CLS = 0.
26. **Original content on detail pages** — P1 — Done when: each detail page includes (a) a generated facts line from stored data ("<Title> is a <year> <genres> <type> directed by <director>, runtime <runtime>, streaming on <providers for GB/US>…"), (b) a template Q&A block (Where can I watch…? / Who stars in…? / When was … released?) rendered as visible text (+ FAQPage schema), (c) an "Updated <date>" line from `updated_at`. No AI generation, no per-visitor cost.
27. **Filter/sort URL control** — P1 — Done when: any list URL with filter/sort query params renders with `noindex,follow` and a canonical to the clean list URL; only clean taxonomy/list URLs are indexable and in sitemaps.
28. **Redirects + 410** — P1 — Done when: a `redirects` table is checked before rendering (301 old → new); titles the owner deletes (not merely hides) return **410**; unknown slugs still 404; admin SEO tab manages the table.
29. **Share (OG) images** — P1 — Done when: sync composes a 1200×630 OG card (poster + title + year on the poster-colour background) to R2 `og/<id>.jpg` for quality-gated titles; ungated titles fall back to the w500 poster; detail OG tags use the card.
30. **Poster colour system** — P1 — Done when: sync extracts each poster's dominant colour (`poster_color`) with sharp; cards/detail use it as the image placeholder background; the detail page header band carries a soft tint of it; Trending and Cast rows are CSS scroll-snap swipe rows.
31. **"Streaming on" strip on detail** — P1 — Done when: detail pages show the first 3 provider logos for the visitor's country (+ "+N more") linking to the watch page.
32. **Admin: instant apply + safety net** — P1 — Done when: (a) any admin save purges the Cloudflare cache (site-wide for ads/config/links, per-URL for content) so changes are live in seconds; (b) every change to links/ads/config writes an `admin_log` row (before/after JSON) with one-click **Undo**; (c) Ad Manager warns when the same code string appears in 2+ slots; (d) a daily workflow exports D1 + config to R2 `backups/` (keep 14).
33. **Admin SEO tab + live meters** — P1 (tab + quota meter), P2 (CWV polish) — Done when: SEO tab manages redirects, shows the 404 log (path, count, last seen — from a capped `notfound_log`), per-page title/noindex overrides, and Google/Bing verification values (rendered as meta tags); Dashboard shows a **free-limit meter** (Functions requests today, D1 rows read today vs free caps, best-effort via Cloudflare GraphQL API; graceful "open Cloudflare dashboard" fallback) and cards linking Search Console + the latest CI Lighthouse report.
34. **New indexable pages** — P2 — Done when: `/year/<yyyy>/` grids, `/movies-like/<slug>/` (full similar page, linked from detail), and `/tv/calendar/` (this week's episode air dates from stored episodes) exist, are SEO-gated, and appear in sitemaps when they pass the gate.
35. **Full admin suite (16 modules)** — P1 core / P2 complete, spec = `docs/ADMIN-PANEL.md` — Done when: every admin list screen has search/filter/sort/CSV export, add/edit/bulk-edit, soft-delete to a 30-day Trash with restore and "used in N places" warnings, scheduling (start/end) where applicable, actor-stamped history with Undo, and per-item stats; modules: Dashboard (today vs yesterday, health lights), Not-working report, Tracking, Titles & People (field locks vs sync, TMDb-ID import, never-import blocklist), Homepage & Categories, Links (test-as-country, health checks), Ads & Income (slot board, test mode, ads.txt), Sync & Data (retry failed, key status), SEO Center (meta template editor, sitemap counts), Media Files, Pages & Requests (trust-page editor + takedown inbox), Alerts & Reports (drop alerts, digests), Users & Access (Owner/Editor/Ads/Viewer roles on top of Cloudflare Access), Change Log/Trash/Backup, Settings & Health (secrets shown as set/not-set), Tools (global search, preview-as-visitor, run-any-job).

## Explicitly out of scope

User accounts, comments, ratings by users beyond Verdict, video hosting, downloads, any forced-click/auto-click mechanics, paid traffic tooling.
