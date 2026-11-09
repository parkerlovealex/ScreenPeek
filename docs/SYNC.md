# SYNC — Daily TMDb Import Engine

Runs in GitHub Actions as the first job of `.github/workflows/nightly.yml` — schedule daily at ~08:30 UTC (TMDb daily exports refresh ~08:00 UTC; Changes data is live) + `workflow_dispatch` for the admin "Run sync now" button. After the sync job succeeds, the same workflow builds the static tier and deploys it (see ARCHITECTURE rendering), then purges SSR cache for changed URLs. A separate `backup.yml` workflow exports D1 + config to R2 `backups/` daily (keep 14). Sync runtime target: < 15 min. Language: TypeScript/Node, code in `sync/`.

## Steps (in order)

1. **Collect candidate IDs**
   - `/movie/changes`, `/tv/changes`, `/person/changes` — last 24h (page through, 100/page). If the previous run failed, extend the window to cover the gap (max 14 days, the API limit).
   - Discovery lists: `/trending/all/day`, `/movie/now_playing`, `/movie/upcoming`, `/tv/on_the_air`, `/tv/airing_today` (page 1–3 each).
   - Merge + dedupe into a work queue.
2. **Filter before fetching details** (protects quota and D1 writes)
   - Skip IDs already in D1 whose `updated_at` is fresh AND not in the changes list.
   - New titles: require a poster path or popularity ≥ threshold (config `sync_popularity_gate`, default sensible) — details fetch will confirm the rest.
3. **Fetch details (bundled, one call per title)**
   - Movies: `/movie/<id>?append_to_response=credits,videos,watch/providers,similar,release_dates,images`
   - TV: `/tv/<id>?append_to_response=credits,videos,watch/providers,similar,content_ratings` + per-season `/tv/<id>/season/<n>` for seasons lacking episode data or marked changed.
   - People (only for credits of fetched titles): `/person/<id>` when new or changed.
   - Auth: `Authorization: Bearer <TMDB_READ_TOKEN>` from env. Respect 429 with exponential backoff; cap concurrency (~5 parallel); hard cap titles/run (config, default 2,000) with overflow logged for next run.
4. **Transform**
   - Build slug (`<name>-<year>`, collision → append `-<id>`); NEVER change an existing slug.
   - Extract: core fields, genres, top 12 cast + directors/creators, trailer (first YouTube trailer key), providers for US/GB/CA/AU only (from `watch/providers` results; store offer types stream/rent/buy/free/ads), release dates + certifications for US/GB/CA/AU, similar title ids (resolve to slugs at render via D1 lookup — store ids).
   - Compute `quality_gate` per DATA-MODEL rules.
5. **Posters → R2** (the copy-once rule)
   - For each title/person with an image we don't already have in R2: download from `image.tmdb.org` (poster w500 source), produce WebP **w185** and **w500** (posters), **w185** profile, **w300** backdrop (first backdrop only). Use `sharp`. Skip if the R2 key already exists (idempotent; a changed poster path in TMDb → new key suffix from the path hash, update the row).
   - **Poster colour:** while processing each new poster, extract its dominant colour with sharp and store it as `titles.poster_color` (hex) — used for image placeholders and the detail header tint.
   - **OG card:** for quality-gated titles, compose the 1200×630 share image (poster left, title + year text on the poster-colour background) → R2 `og/<title_id>.jpg`. Skip if unchanged.
   - Poster download failures: keep the title, `poster_r2 = NULL` (placeholder at render), log a warning — never fail the run for images.
6. **Upsert D1** — batched statements (D1 HTTP API or `wrangler d1 execute --remote` from the Action; prefer the API with a token). Update lookup counts (genres/collections). Update FTS index rows for changed titles.
7. **Finish**
   - Write `sync_log` row (added/updated/errors, duration).
   - Refresh `home:sections` KV if Top 10 membership changed materially (or leave to render-time query — prefer render-time, fewer writes).
   - Purge Cloudflare cache for `/`, `/new/`, `/top10/` (API; failure = warn only).
   - Telegram summary to owner ONLY on failure or partial-with-errors (success stays silent; admin Dashboard is the success record). Use `TELEGRAM_BOT_TOKEN` + `OWNER_CHAT_ID` env; skip silently if unset.
   - (P2) Post new featured titles to the site Telegram channel.

## Recovery & edge cases

- Gap > 14 days (Changes window exceeded): fall back to TMDb **Daily ID Exports** (`https://files.tmdb.org/p/exports/movie_ids_MM_DD_YYYY.json.gz`, `tv_series_ids_…`) → diff against D1 ids → fetch details for missing popular IDs (popularity field is in the export line). Implement as `sync/reconcile.ts`, manual-dispatch only in P1 (automatic monthly in P3).
- A title deleted at TMDb (404 on details): mark `hidden=1`, log it; do not hard-delete (links/bookmarks).
- Partial failure mid-run: everything is upsert-based and idempotent — rerunning is always safe.

## Env (GitHub Actions secrets)

`TMDB_READ_TOKEN` (or `TMDB_API_KEY`), `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `TELEGRAM_BOT_TOKEN` (optional), `OWNER_CHAT_ID` (optional), `SITE_URL` (for Telegram posts / sitemap).

## What sync must NEVER do

- Call OMDb in the hot path for every title (external ratings, if enabled later, are a separate weekly job for top titles only, cached in a `ratings_ext` table — P2 note, not P1).
- Trigger a site rebuild/deploy.
- Write per-visitor anything. Sync is the only bulk writer.
