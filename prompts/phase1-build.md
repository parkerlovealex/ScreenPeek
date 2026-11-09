# PHASE 1 PROMPT — MVP build

Prerequisite: you have read `AGENTS.md`, `PRD.md`, `docs/*` (per the master prompt). Build in this order (mirrors `TASKS.md`):

## Build order

1. **Scaffold** — Astro + TypeScript project in this repo (Cloudflare adapter, SSR), repo structure per `docs/ARCHITECTURE.md`, single CSS file, base layout with header/footer/attribution, reserved ad-slot component. `.env.example` from `templates/.env.example`. `wrangler.toml` with binding placeholders (DB, CONFIG, POSTERS).
2. **Database** — copy `templates/schema.sql` to `db/schema.sql`; write a short `db/README` note on applying it locally (`wrangler d1 create` + execute) and remotely. Local dev must work with a local D1 (wrangler) or a seeded SQLite fallback — seed script with ~50 real-shaped sample titles so pages can be developed before the sync exists (sample data clearly marked, removable).
3. **Sync v1** (`sync/`) — per `docs/SYNC.md`: changes + discovery lists → filter → bundled details → slug/transform → posters to R2 via S3 API (sharp WebP w185/w500, profiles w185, backdrop w300) → D1 upserts (HTTP API) → FTS update → sync_log → Telegram failure alert (env-gated). `sync/tmdb.ts` is the only module that knows TMDb's URL shape. GitHub workflows: `.github/workflows/nightly.yml` (daily 08:30 UTC + workflow_dispatch: sync → build static tier per TASKS 1.23 → deploy → purge), `backup.yml` (daily D1+config export), and `ci.yml` (typecheck + build + speed gate per FEATURES #23).
4. **Public pages** — per `docs/ROUTES-AND-DESIGN.md`: home, movies/series lists with filters + pagination, `/new/`, `/top10/`, `/upcoming/`, detail (movie + tv) with the fixed anatomy, season + episode pages, cast/person pages, genre/collection/language grids, trailer page (click-to-load facade), search page + suggestions, watch page (geo country, provider groups, JustWatch credit, `/go/` outbound), mylist (localStorage), trust pages, styled 404. Edge-cache headers per route table.
5. **Functions** — `/go/[slug]` (KV lookup → country rule → device rule → (split is Phase 2; read the rules JSON but apply country/device only) → batched click log → 302), `/api/search` (FTS5, JSON, ≤8 results), `/api/vote` (aggregate upsert, basic abuse guard: one vote per title+IP per day via KV marker).
6. **Ads system** — `AdSlot` component resolves (page_type, placement) from KV mirror of `ad_slots`; placeholders with exact reserved sizes when unset; popunder injector with session cookie cap reading `popunder_cap_hours`; Social Bar from global slot; NO popunder on watch outbound (the watch page must not load the popunder slot at all).
7. **Admin** (`/admin`) — the full spec is `docs/ADMIN-PANEL.md`; build its **P1 scope** now (money modules summarised in `docs/ADS-AND-ADMIN.md`): Dashboard (sync status, catalogue counts, health lights, quota meter, last-20-changes), Link Manager, Ad Manager (slot board + duplicate warning), Content/Homepage & Categories, Titles & People editor core (field locks, blocklist, import by ID), Sync & Data, SEO Center core, Pages editor (trust pages from the `pages` table), Settings & Health (secrets as set/not-set), Tools (global search, preview-as-visitor, purge, run-job), Change Log/Trash/Backup, and the **universal list powers** (ADMIN-PANEL §A) on every list screen. Admin assumes Cloudflare Access in front; also verify the Access email header server-side and stamp it into `admin_log.actor`.
8. **SEO** — per `docs/SEO-AND-DEPLOY.md`: meta/OG templates, JSON-LD, dynamic sitemap Functions, robots.txt, canonicals, noindex for ungated titles.
9. **Deploy prep** — `docs/SEO-AND-DEPLOY.md` checklist turned into `DEPLOY-CHECKLIST.md` in repo root with the owner steps marked; ensure preview deployments render ad placeholders (ADS_ENABLED flag).

## Rules while building

- Mobile-first; test every page at 360px width.
- Every list grid: 24 items, server-side pagination with real links.
- No client JS beyond the allowed list in the design doc.
- Commit in small, named commits per task (e.g. `feat(sync): changes collector + filter`).

## Verification (report each, honestly)

- [ ] `npm run build` + typecheck pass; CI green
- [ ] Local: home/detail/watch pages render from seeded data; first-screen own-origin transfer ≤ ~100 KB (report the measured number)
- [ ] Sync dry-run against TMDb with a real key (owner provides) imports ≥ 50 titles with posters in R2 and correct slugs; rerun adds 0 duplicates
- [ ] `/go/` test: create link in admin → live redirect + click counted within 60s, no deploy
- [ ] Ad placeholder → paste a test code in admin → renders in the right slot only; popunder fires once per session and never from the watch page
- [ ] Verdict vote persists and shows percentages; My List survives reload
- [ ] Unknown slug and unknown route → styled 404 (and the 404 is logged); ungated title has noindex and is absent from sitemap
- [ ] CI speed gate is live: a deliberately bloated test page FAILS the build; production templates pass with the measured KB reported
- [ ] Hybrid tier: nightly workflow prerenders hubs + top titles; static file count printed and < 15,000; a long-tail title still renders via SSR
- [ ] Admin save test: change an ad code → purge fires → new code visible on the live page within ~1 minute without a deploy; Undo restores the old code; duplicate code in two slots triggers the warning
- [ ] Structured data check: detail page has Movie + FAQ schema and NO aggregateRating; a redirect from the SEO tab returns 301; a deleted title returns 410
- [ ] OG card exists for a gated title (1200×630) and is referenced by its OG tags; images served from the R2 custom domain with immutable cache headers
