# ARCHITECTURE

## System diagram (text)

```
                 ┌──────────────────── GitHub repo ────────────────────┐
                 │  Astro site  ·  sync/ (Node script)  ·  workflows    │
                 └──────┬──────────────────────────┬────────────────────┘
        push to main    │                          │ daily cron / manual
                        ▼                          ▼
              Cloudflare Pages            GitHub Actions (sync job)
              (build + deploy)             1. TMDb Changes + lists
                        │                  2. fetch details (bundled)
                        │                  3. upsert ──► D1
                        │                  4. posters ─► R2 (WebP)
                        ▼                  5. log + Telegram alert
   Visitor ──► Pages (edge-cached HTML) ──► reads D1 (render) / KV (config+links)
                        │
                        ├─ /go/<slug>  Function: KV rules → log click → 302
                        ├─ /api/search Function: D1 FTS5
                        └─ /api/vote   Function: batched D1 write
   Owner ──► Cloudflare Access ──► /admin (Astro pages + Functions) ──► D1/KV writes
```

## Components

| Piece | Tech | Job |
|---|---|---|
| Web app | Astro + TypeScript on Cloudflare Pages | All public pages + admin UI |
| Render data | D1 (SQLite) | Titles, people, credits, providers, episodes, votes, link clicks, sync log |
| Config store | KV namespace `CONFIG` | Links, ad slots, site settings — read at render/redirect time (fast, cached at edge) |
| Media | R2 bucket `posters` (public) | w185 + w500 WebP posters, w300 backdrops for detail only |
| Sync | Node/TypeScript script in `sync/`, run by GitHub Actions | Daily TMDb import (see SYNC.md) |
| Dynamic endpoints | Pages Functions in `functions/` | `/go/[slug]`, `/api/search`, `/api/vote` only |
| Admin security | Cloudflare Access application on `/admin/*` | Owner login (email OTP / Google) — no passwords in code |

## Rendering & caching strategy (hybrid, v2)

Two tiers, chosen because SSR-on-Pages can invoke a Function even when a response is cached, while static assets are always free and unlimited:

- **Static tier (nightly pre-build):** home, hub/list index pages, and the top `static_top_n` quality-gated titles (default 3,000 by popularity) are prerendered by Astro (`prerender = true` on those routes, fed from D1 at build time). The nightly workflow is: sync → build → `wrangler pages deploy`. The build counts output files and **fails if the total would exceed 15,000** (Pages cap 20,000 — keep margin as taxonomy pages grow).
- **SSR tier (long tail):** all other catalogue pages render on demand from D1 (Astro SSR, Cloudflare adapter) with `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` (home/lists 3600), PLUS a Cloudflare Cache Rule on the custom domain ("cache eligible: eligible for cache" for catalogue paths) so edge-cached responses are served without invoking Functions wherever Cloudflare supports it.
- **Cache purge:** (a) nightly deploy naturally replaces static files; (b) SSR cache: after each sync, purge home/list/changed-title URLs via the Cloudflare API (failure = warn, SWR covers it); (c) **admin saves purge immediately** — ad/config/link edits purge site-wide, content edits purge the affected URLs — so admin changes are live in seconds.
- Result: the pages that get ~most traffic never touch Functions/D1 at all; long-tail first hits render once and cache; quotas stay far below free limits.

## Geo detection

Use Cloudflare's request country (`request.cf.country` / `CF-IPCountry`) in Functions/layout — no third-party geo service, no client JS needed. Store the resolved country in a cookie for consistency; `/watch/` and provider pages key off it. Supported launch countries: US, GB, CA, AU; fallback US.

## Repo structure (target)

```
movie-system/
  AGENTS.md  PRD.md  TASKS.md  START-HERE.md
  docs/  prompts/  templates/
  src/
    pages/         index.astro, movies/, series/, movie/[slug]/, tv/[slug]/, tv/[slug]/season/[n]/,
                   cast/[slug]/, genre/[slug]/, collection/[slug]/, language/[slug]/,
                   watch/[slug]/, trailer/[slug]/, on/[provider]/, top10/, upcoming/, new/,
                   search/, mylist/, about/, privacy/, dmca/, contact/, admin/...
    components/    PosterCard, RatingStrip, VerdictWidget, WatchBox, AdSlot, Pagination, Header, Footer
    layouts/       Base.astro (meta/SEO, ad slots, Social Bar include, attribution footer)
    lib/           db.ts (D1 queries), config.ts (KV), geo.ts, ads.ts (slot resolution), format.ts
    styles/        site.css (single file, ≤ ~10 KB minified)
  functions/
    go/[slug].ts   api/search.ts   api/vote.ts
  sync/
    sync.ts  tmdb.ts  posters.ts  sitemap.ts  notify.ts
  db/
    schema.sql     (same as templates/schema.sql — applied via wrangler d1 execute)
  .github/workflows/
    nightly.yml    (schedule: daily ~08:30 UTC + workflow_dispatch: sync → build static tier → deploy → purge)
    backup.yml     (daily: export D1 + config JSON to R2 backups/, keep last 14)
    ci.yml         (typecheck + build + speed gate on push)
  wrangler.toml    (D1/KV/R2 bindings — ids filled at setup)
  astro.config.mjs  package.json  tsconfig.json  .env.example
```

## Data flow rules

- Writes to D1 happen ONLY from: sync job, `/api/vote` (batched), admin actions, `/go` click logging (batched/queued — use waitUntil + periodic flush or a lightweight counter increment; keep it under the 100k writes/day cap).
- KV is the read-path for anything the admin can edit; admin writes update D1 (source of truth) AND KV (read model) in the same action.
- All timestamps stored as UTC ISO text; display formatting at render.

## Failure behaviour

- D1 unavailable → serve stale edge cache; never a raw error page for catalogue routes.
- Sync failure → site unaffected (yesterday's data); admin banner + Telegram alert; next scheduled run retries; Changes lookback window (up to 14 days) makes recovery automatic.
- R2 poster missing → placeholder image (inline SVG data URI) — never a broken-image icon, never a hotlink fallback.

## Cost & quota guardrails (free tier)

| Resource | Free limit | Design answer |
|---|---|---|
| Pages bandwidth | Unlimited | — |
| Functions requests | 100k/day | Only 3 dynamic routes; everything else cached |
| D1 reads | 5M rows/day | Edge cache + indexed queries + paginated grids (24) |
| D1 writes | 100k/day | Sync upserts + batched votes/clicks only |
| D1 storage | 5 GB | Metadata-only rows; images in R2 |
| R2 storage | 10 GB | 2 WebP sizes/title ≈ 60 KB |
| Builds | 500/mo | Nightly static refresh ≈ 30/mo + manual code deploys |
