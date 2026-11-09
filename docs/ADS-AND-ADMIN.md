# ADS & ADMIN

## A. Money map (ad system)

**Principle:** each page type gets its OWN Adsterra placement codes, so revenue can be read per journey step. Never reuse one code in two placements (stats merge and the second placement pays as the first).

### Slots per page type

| Page type | Slots |
|---|---|
| home | top_300x250 (after first row), native (mid-page), sticky_320x50, social_bar |
| list (genre/movies/top10/…) | native (after row 2), sticky_320x50, social_bar; infeed banner every 12 cards = reuse of `list/native` is NOT allowed — create `list/infeed` placement |
| detail | top_300x250, native, sticky_320x50, social_bar, popunder |
| cast (person) | top_300x250, native, sticky_320x50, social_bar |
| watch | top_300x250, native, sticky_320x50, social_bar — **popunder DISABLED here** |
| trailer | top_300x250, sticky_320x50, social_bar |
| search | native, sticky_320x50, social_bar |

Session math at target behaviour (5 pages): ≈ 20 display/native/social impressions + affiliate chances on watch.

### Hard rules for ad code

1. Popunder: **max 1 per session**, cookie `pop_shown` with configurable lifetime (default 24h, admin setting `popunder_cap_hours`). Never on `/watch/` outbound, never together with an interstitial on the same click.
2. Smartlink is never pasted into templates. Smartlink destinations live in the Link Manager; buttons that monetise (e.g. "Full Episode List", sponsored provider rows) link to `/go/<slug>`.
3. Ad snippets are stored raw in `ad_slots.code` and injected only when `enabled=1`; when empty/disabled, render the reserved fixed-size placeholder box with no network calls.
4. Social Bar: one code site-wide (page_type `global`), injected from the base layout.
5. Never modify/wrap Adsterra scripts (their terms ban modified code). Inject exactly as provided.
6. No ads inside `/admin`, `/mylist`, or trust pages.

## B. Admin panel (`/admin`, Cloudflare Access protected)

> **v3: the full admin specification now lives in `docs/ADMIN-PANEL.md`** (16 modules, universal list powers, trash, scheduling, roles, honest analytics limits). This section remains the summary for the money-related modules; ADMIN-PANEL.md wins on admin detail.

Design: one field per row, label + short help text + example, red * on required fields, top-to-bottom save flow (owner operates it by hand on a phone). Confirm dialogs on destructive actions. Every save shows a success toast and takes effect live (KV update) — no deploy.

### Modules

1. **Dashboard** — cards: Last sync (time, status, added/updated counts, errors), Catalogue (titles total, gated total, people), Clicks today (top link), Revenue snapshot (Adsterra API, P2; placeholder in P1), Alerts area (sync failed, quota warnings).
2. **Link Manager** — table: Name · Slug (`/go/…`) · Type · Destination (truncated) · ON/OFF toggle · Clicks today/total · Edit. Editor fields: Name*, Slug* (unique, locked after first click), Type*, Destination URL*, Country destinations (optional per US/GB/CA/AU + default), Device destinations (mobile/desktop optional), A/B split (list of URL + %, must total 100 when used), Enabled. Rule precedence: country → device → split → default. Validation: URLs must be https.
3. **Ad Manager** — grid of (page type × placement) with code textarea, enabled toggle, and "placement name to create in Adsterra" helper text (e.g. `detail_top_300x250`). Global settings: Social Bar code, popunder code + cap hours, master ads ON/OFF.
4. **Content** — Pin/unpin titles (search by title), homepage section order (drag or up/down), featured collections editor (name + title ids), hide/unhide a title, verdict reset for a title.
5. **Sync** — status table (last 10 runs from `sync_log`), "Run sync now" button (calls GitHub Actions `workflow_dispatch` with a repo-scoped token from env), API plug panel (TMDb base URL display, key = "set in env" indicator, source select disabled in v1 with note), sync thresholds (popularity gate, max titles per run).
6. **Stats (P2)** — Adsterra Publisher API: date range, by country / placement / device: impressions, clicks, CTR, CPM, revenue (API key in env). Plus internal: top pages (views), top links (clicks), verdict totals.
7. **Settings** — site name, tagline, logo upload (→ R2 `site/logo.webp`), socials (each stored as a Link Manager entry), Telegram channel URL, analytics ID, maintenance mode toggle (shows a static "back soon" page to visitors, admin still accessible), ratings_external flag, Google + Bing site-verification values (rendered as meta tags on the home page).
8. **SEO tab** — Redirects manager (`redirects` table: from-path, to-URL/path, type 301 — checked before render); 404 log viewer (top missing paths with counts — fix by creating a redirect or a page); per-page SEO overrides (custom title / noindex for any path, `seo_overrides`); deleted-title handling (owner deletes → 410 page, distinct from hide).
9. **Backup** — Export: one JSON file (links, ad slots (codes included — treat file as sensitive), config, content pins, redirects). Import: file upload → validate → confirm → replace. PLUS automatic daily backup: workflow exports D1 + config JSON to R2 `backups/<date>/`, keeps the last 14.

### Instant apply + safety net (applies to ALL admin modules)

- **Cache purge on save:** every save calls the Cloudflare purge API — ads/config/links purge site-wide (they appear everywhere), content/SEO edits purge the affected URLs. The save toast says "Live now" only after purge succeeds; if purge fails, the toast warns and a "Purge cache" retry button sits on the Dashboard. (Config/links are also in KV, so SSR renders pick changes up immediately; purge is for already-cached pages.)
- **Change history with undo:** every mutation to links, ad slots, config, redirects and pins writes an `admin_log` row (entity, id, before JSON, after JSON, time). Dashboard shows the last 20 changes with an **Undo** button that restores the "before" state (and itself logs + purges).
- **Duplicate ad code warning:** Ad Manager compares code strings across slots on save and across the grid on load — if the identical code appears in 2+ slots, a warning banner names the slots (stats would merge; owner must create separate placements in Adsterra).
- **Dashboard meters:** free-limit meter (Functions requests today + D1 rows read today vs free caps, via Cloudflare GraphQL analytics API using the existing API token; if unavailable, show a deep link to the Cloudflare dashboard instead of fake numbers), plus cards linking Google Search Console and the latest CI Lighthouse/speed report.

### Admin technical notes

- Admin pages are Astro SSR under `src/pages/admin/`; mutations via form POST to small Functions (or Astro actions) writing D1 + KV together.
- Cloudflare Access protects `/admin/*` at the edge; the app itself also checks the `Cf-Access-Authenticated-User-Email` header exists before rendering admin (defence in depth).
- No ad scripts, no analytics on admin pages.
