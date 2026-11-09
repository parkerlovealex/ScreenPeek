# ADMIN PANEL — full specification (v3)

This document is the complete admin spec. It extends (and where it conflicts, overrides) the admin section of `ADS-AND-ADMIN.md`, which remains the authority for the ad money map. Everything here is designed to run inside Cloudflare free-tier quotas — read the "Honest limits" box before building.

Phases: **P1** = ships with the MVP admin, **P2** = growth, **P3** = scale/nice-to-have. Codex: build P1 items with Phase 1, P2 items with Phase 2.

## Honest limits (design constraints, not bugs)

1. **Analytics are aggregate, not GA-style.** Per-visitor tracking would need a beacon on every page (extra JS + write volume we refuse to spend). Traffic numbers come from the **Cloudflare GraphQL analytics API** (requests/pageviews estimates by path, country, device, referrer — server-side, zero visitor JS) plus our own **batched D1 counters** (views per title, `/go` clicks, searches, votes). "Visitors" is therefore labelled an estimate wherever shown. If the owner later wants exact analytics, the Settings `analytics_id` GA4 slot exists — it's their switch, off by default.
2. **Income per item is exact only where an API exists.** Per ad slot/placement: exact (Adsterra API). Per link: we know clicks exactly; income lives in each affiliate network's own dashboard, so the panel shows clicks and leaves income to the network (optionally a manual income field per link for the owner's own entries). Per title: views + watch clicks, no fake income numbers.
3. **Scheduling granularity.** Links/ads/pins support start/end dates. KV-driven elements (links, ad codes on SSR pages) honour them within a minute. On **static-tier pages**, a scheduled change lands at the next nightly build or the next purge — the UI must say so next to the schedule fields.
4. **Login history lives in Cloudflare Zero Trust** (Access logs). In-app, the panel records the acting admin's email on every change (`admin_log.actor`) and shows change history per person; a "Login history" button deep-links to the Zero Trust logs.
5. **Deploy rollback is a deep link** to the Pages deployments list (the public API doesn't offer one-click rollback); everything else in Settings & Health is native.

## A. Universal powers (every list screen in admin)

- **Search + filter + sort** on the main columns; results paginate (50/page).
- **Export CSV** of the current filtered list (owner/editor roles only).
- **Add / Edit / Bulk edit** (select rows → set field → apply; bulk actions write one `admin_log` entry listing the ids).
- **Soft delete → Trash:** deletes set `deleted_at`; items sit in Trash for **30 days**, then the nightly job purges them permanently. Restore from Trash. Before deleting, if the item is referenced (a link used in pins/config, a title pinned or in a collection), show **"used in N places"** and require confirm.
- **Start/end dates** where the entity supports scheduling (links, ad slots, pins, homepage sections, collections).
- **History:** every mutation writes `admin_log` (actor email from the Access header, entity, before/after JSON) with **Undo** (see §Change log).
- **Per-item stats strip** in the editor: views / clicks / income as available per the limits above.
- All saves follow the v2 rules: **cache purge on save** + toast "Live now" only after purge succeeds.

## B. The 16 modules

### 1. Dashboard (P1)
Today vs yesterday cards: pageviews (CF estimate), Watch/`/go` clicks, Adsterra income (API, P2 — placeholder P1), titles added. Top 5 pages, top 5 countries. **Health lights:** last sync status, quota meter (Functions + D1 vs free caps), ads state (any empty/duplicate slot = amber), broken items count (→ module 2). **Last 20 changes** with Undo. Quick buttons: Run sync, Purge cache, Maintenance toggle.

### 2. Not-working report (P1 core, P2 complete)
One queue of everything broken, each row: problem, item, severity, **Fix** button (deep link to the right editor), status (open / snoozed / fixed — auto-clears when the check passes). Checks: failed/partial syncs (P1); titles missing poster or overview (P1); empty ad slots (P1); duplicate ad codes (P1); 404 paths with visits (P1, from `notfound_log`); broken outbound links (P2, weekly health-check workflow); missing R2 images referenced by rows (P2); slow templates from the latest CI Lighthouse report (P2); quota > 80% (P1).

### 3. Tracking (P2)
Date range + compare-with-previous-period. Group by: page type, title (top 100), country, device, referrer source (Google / Telegram / social / direct — from CF analytics). Watch clicks by title and provider. **Top searches + zero-result searches** (from `search_log`, written batched by `/api/search`). **Drop alert:** nightly job compares yesterday vs 7-day average; pageviews or income down > 40% → Telegram alert (configurable in module 12).

### 4. Titles & People (P1 core, P2 full editing)
List with the universal powers. Editor: every stored field editable (title, overview, year, runtime, genres, poster replace via Media, providers are read-only from sync). **Field locks:** any field the owner edits gets a lock flag (`locked_fields`); sync never overwrites locked fields (it logs "kept manual edit" in the sync run). Pin / hide / delete (delete → 410 behaviour + **never-import blocklist** entry so sync can't resurrect it). **Add / re-fetch by TMDb ID:** dispatches the sync workflow with an `ids` input for a targeted import. Seasons & episodes: view + edit names/dates (P2), episode stills via Media. **Reset votes** per title. People editor mirrors this (name, bio lock, photo).

### 5. Homepage & Categories (P1)
Homepage sections: order (up/down), show/hide, schedule, source (auto list type or manual pins), pinned titles per section. Manual **Top 10 override** list. Collections editor (name, slug, title picker). Taxonomy overrides (`taxonomy_overrides`): for genre / year / language / provider pages — display name, order, hide, intro text (rendered above the grid, also used as the page's meta description base).

### 6. Links (P1, health P2)
Everything in `ADS-AND-ADMIN.md` Link Manager, plus: start/end dates (auto enable/disable), click stats by day/country/device (from `click_log`), **Test-as** tool: pick country (US/GB/CA/AU) + device → shows the destination the rules produce, without logging a click. **Weekly health check** (P2): workflow fetches each enabled destination, flags non-200/redirect-chains in module 2.

### 7. Ads & Income (P1 board, P2 numbers)
Slot board: every (page type × placement) as a card — Filled / Empty / Duplicate badge, code editor, ON/OFF, **test mode** (slot renders only for admins or with `?adtest=1` on an Access-authenticated preview), schedule (start/end), code history (from `admin_log`). Global: popunder cap hours, Social Bar code, master switch. **ads.txt** editor (plain text file served at `/ads.txt`; low value for Adsterra but harmless and sometimes requested by other networks). Income (P2): Adsterra API by day / country / placement / device, matched to slot names.

### 8. Sync & Data (P1)
Run now (workflow dispatch), last 20 runs with per-run errors, **Retry failed** (re-dispatch with the failed ID list stored from the run), limits editor (popularity gate, max titles/run, static_top_n), **key status** (derived: last sync auth result; "Test key" dispatches a 1-minute check workflow — the site itself never calls TMDb), **Import by ID** (movie/TV/person), **Never-import list** (blocklist table: add/remove, shows what a delete added).

### 9. SEO Center (P1 core, P2 numbers)
The v2 SEO tab, plus: **meta template editor** (the templates from ROUTES-AND-DESIGN stored in config with the same variable syntax, preview with a sample title), sitemap counts (live counts of gated titles/people/taxonomy vs what's in the sitemap files), verification codes (from Settings), Search Console card (link + optional CrUX API key in env for Core Web Vitals numbers, P2).

### 10. Media Files (P2)
Browse R2 buckets (posters / og / site) with search by key; replace a title's poster (upload → sharp → both sizes + colour re-extract → row update → purge); delete (row falls back to placeholder); **find missing** (DB references a key that isn't in R2) and **find unused** (R2 keys no row references — report only, delete requires confirm); storage meter (sum of object sizes vs 10 GB free).

### 11. Pages & Requests (P1 pages, P2 inbox)
Trust pages (About / Privacy / DMCA / Contact / 404 text) edited as markdown in `pages` table, rendered by the site, version history via `admin_log` + restore. **Requests inbox (P2):** contact form + DMCA/takedown form on the site (Turnstile-protected Function → `inbox` table); each request shows linked title (if any) with a **one-click Hide title**; status workflow (new / done / dismissed); the owner's reply happens from their own email (the panel stores no mailbox).

### 12. Alerts & Reports (P2)
Alert toggles per event: sync failed, quota > 80%, traffic/income drop, link health failures, backup failed. Telegram posting controls (channel, daily cap, post-now, history of posts with links). **Digest job:** daily or weekly summary (pageviews, income, top titles, clicks, problems open) via Telegram; email optional via a free-tier sender key in env (off until the owner adds one).

### 13. Users & Access (P2)
Identity = Cloudflare Access (emails). App-level roles in `admin_users`: **Owner** (everything, only role that can hard-delete, restore backups, or manage users), **Editor** (content, links, SEO, media), **Ads** (Ads & Income + Links only), **Viewer** (read-only). Per-module switches refine a role. Every admin page checks role + module server-side; the UI hides what a role can't use, but the server check is the real gate. Change history filtered by person (from `admin_log.actor`); Login history button → Zero Trust logs (see limits).

### 14. Change Log, Trash, Backup (P1)
Global change log (filter by entity/actor, Undo per row where the entity still exists). **Trash:** all soft-deleted entities in one view with age + restore + purge-now (Owner only for purge). Backup: manual export (v2), **daily auto-backup** status + last 14 files (R2), **Restore** (Owner only; imports into D1 + KV with a pre-restore snapshot taken first), **export any table** as CSV/JSON.

### 15. Settings & Health (P1)
Site details (name, tagline, logo), global switches (maintenance, ratings_external, ads master), cache TTL settings (SSR s-maxage values), **Secrets panel:** each expected env var listed as "Set ✓ / Not set ✗" (values never shown), error summary (sync errors + 404 count + function error count if available), latest CI speed/Lighthouse result, quota meters, deploy history with **rollback deep link** to Pages.

### 16. Tools (P1)
Global admin search (titles, people, links, pages, redirects in one box). **Preview as visitor:** set a preview country cookie (US/GB/CA/AU) + device width toggle (360px frame) — honoured only for Access-authenticated admins; a banner reminds you preview mode is on. Purge cache (full or single URL). **Run any job:** buttons dispatching each workflow (nightly sync, backup, link health, reconcile) with the run link shown after dispatch.

## C. Data additions (see schema.sql)

Scheduling columns on `links`/`ad_slots` (`starts_at`, `ends_at`); `titles.locked_fields` + `people.locked_fields` (JSON arrays); `titles/people.deleted_at` (trash) — note `deleted` (410) vs `deleted_at` (trash) are different states: Trash first (30 days, reversible, page hidden), purge or explicit "delete forever" → `deleted=1` (410) for titles. New tables: `blocklist`, `admin_users`, `pages`, `inbox`, `search_log`, `taxonomy_overrides`. `admin_log` gains `actor`.

## D. Counting rule (unchanged, applies everywhere)

Visits/views/clicks/searches are **batched aggregates** (in-memory or KV accumulation flushed periodically by the nightly job or opportunistic `waitUntil` writes), never one D1 write per hit. Any module whose numbers would require per-hit writes must use the CF GraphQL API instead.
