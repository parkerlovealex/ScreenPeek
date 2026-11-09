# DATA MODEL — Cloudflare D1 (SQLite)

The executable schema is `templates/schema.sql` (copied to `db/schema.sql` in the repo). This doc explains the shape and the rules. Keep queries indexed; D1 bills by rows read.

## Tables

**titles** — one row per movie or TV show.
`id` (TMDb id, PK with type), `type` ('movie'|'tv'), `slug` (unique, e.g. `buried-alive-2025`), `title`, `original_title`, `overview`, `release_date` (text ISO), `year`, `runtime_min`, `status`, `original_language`, `popularity` (real), `vote_average`, `vote_count`, `poster_r2` (R2 key or NULL), `backdrop_r2`, `poster_color` (hex, dominant colour from the poster), `og_r2` (1200×630 share card key or NULL), `genres` (JSON array of slugs), `quality_gate` (0/1 — passes SEO/index gate), `hidden` (0/1 admin), `deleted` (0/1 admin — deleted titles return 410), `pinned` (0/1), `views` (int, batched), `updated_at`.
Indexes: `slug` unique, `(type, popularity DESC)`, `(type, release_date DESC)`, `year`.

**people** — `id` (TMDb person id PK), `slug` unique (`tom-hanks-<id>` suffix on collision), `name`, `bio`, `profile_r2` (w185 WebP or NULL), `popularity`, `updated_at`.

**credits** — `title_id`, `title_type`, `person_id`, `role` ('cast'|'director'|'creator'), `character` (text, cast only), `ord` (billing order). PK `(title_id, title_type, person_id, role)`. Index on `person_id` (filmography) and `(title_id, title_type, ord)` (cast row).

**seasons** — `title_id`, `season_number`, `name`, `episode_count`, `air_date`. PK `(title_id, season_number)`.
**episodes** — `title_id`, `season_number`, `episode_number`, `name`, `overview`, `air_date`, `still_r2`. PK `(title_id, season_number, episode_number)`.

**providers** — where-to-watch per country. `title_id`, `title_type`, `country` ('US'|'GB'|'CA'|'AU'), `provider_id` (TMDb/JustWatch id), `provider_name`, `logo_r2` (small logo or NULL), `offer_type` ('stream'|'rent'|'buy'|'free'|'ads'). Index `(title_id, title_type, country)`.

**releases** — per-country release date + certification (P2 display, store from P1 if cheap): `title_id`, `title_type`, `country`, `release_date`, `certification`. PK `(title_id, title_type, country)`.

**genres / collections / languages** — small lookup tables: `slug` PK, `name`, `title_count` (maintained by sync for list pages).

**links** (admin Link Manager; mirrored to KV `link:<slug>`) — `slug` PK, `name`, `destination`, `type` ('smartlink'|'affiliate'|'social'|'telegram'|'other'), `enabled`, `rules` (JSON: `{byCountry:{GB:"url",...}, byDevice:{mobile:"url",desktop:"url"}, split:[{url:"...",pct:50},...]}`), `clicks_total`, `clicks_today`, `clicks_day` (date of clicks_today), `updated_at`.

**ad_slots** (mirrored to KV `ad:<page_type>:<placement>`) — `page_type` ('home'|'list'|'detail'|'cast'|'watch'|'search'|'admin-none'), `placement` ('top_300x250'|'native'|'sticky_320x50'|'social_bar'|'popunder'|'infeed'), `code` (raw snippet text), `enabled`. PK `(page_type, placement)`.

**config** (mirrored to KV `config`) — `key` PK, `value`. Keys: `site_name`, `site_tagline`, `logo_r2`, `socials` (JSON), `telegram_channel`, `popunder_cap_hours`, `ratings_external` ('0'/'1'), `maintenance` ('0'/'1'), `analytics_id`, `tmdb_base` (display only; real key stays in env), `static_top_n` (default 3000), `google_site_verification`, `bing_site_verification`.

**votes** — verdict: `title_id`, `title_type`, `choice` ('must'|'good'|'average'|'skip'), `count`. PK `(title_id, title_type, choice)` — store aggregate counts only, plus a per-device marker in the visitor's localStorage (no per-user rows).

**click_log** (batched, pruned by sync to last 30 days) — `slug`, `day`, `country`, `device`, `count`. PK `(slug, day, country, device)`.

**sync_log** — `id` autoincrement, `started_at`, `finished_at`, `status` ('ok'|'partial'|'failed'), `added`, `updated`, `errors` (text), `source` ('cron'|'manual').

**redirects** — `from_path` PK, `to_target` (path or full URL), `type` (301), `created_at`. Consulted before rendering catalogue routes (KV mirror `redir:<from_path>` for SSR hits).

**seo_overrides** — `path` PK, `title` (nullable), `noindex` (0/1). Applied at render over the templates.

**notfound_log** — `path` PK, `count`, `last_seen`. Written (batched, capped at ~500 rows, LRU-pruned by sync) when a catalogue-style URL 404s; shown in the admin SEO tab.

**admin_log** — `id` autoincrement, `ts`, `actor` (Access email), `entity` ('link'|'ad_slot'|'config'|'redirect'|'content'|'title'|'page'), `entity_id`, `before` (JSON), `after` (JSON). Powers change history + Undo in admin. Keep last 500 rows.

**Admin-suite tables (v3, spec in ADMIN-PANEL.md):**
- Scheduling: `links.starts_at/ends_at`, `ad_slots.starts_at/ends_at` (NULL = always).
- Manual-edit protection: `titles.locked_fields`, `people.locked_fields` (JSON arrays of field names the sync must not overwrite); `titles.deleted_at`, `people.deleted_at` (Trash soft-delete; distinct from `titles.deleted` = permanent 410).
- **blocklist** — `tmdb_id`, `type`, PK `(tmdb_id, type)`, `reason`, `created_at`. Sync skips these IDs forever (until removed in admin).
- **admin_users** — `email` PK, `role` ('owner'|'editor'|'ads'|'viewer'), `modules` (JSON overrides), `created_at`.
- **pages** — `slug` PK ('about'|'privacy'|'dmca'|'contact'|'notfound'), `title`, `body_md`, `updated_at`. Trust-page content, edited in admin.
- **inbox** — `id`, `ts`, `kind` ('contact'|'takedown'), `name`, `email`, `message`, `title_ref` (slug, nullable), `status` ('new'|'done'|'dismissed').
- **search_log** — `day`, `query`, `results`, `count`; PK `(day, query)`; written batched from `/api/search`; powers top/zero-result searches.
- **taxonomy_overrides** — `kind` ('genre'|'year'|'language'|'provider'|'collection'), `slug`, `display_name`, `ord`, `hidden`, `intro`; PK `(kind, slug)`.

**search index** — FTS5 virtual table `titles_fts(title, slug, year, type)` kept in step by sync (external-content or manual sync on upsert — pick the simpler manual approach and note it in code).

## KV keys

- `config` — whole site config as one JSON object
- `link:<slug>` — one link incl. rules JSON
- `ad:<page_type>:<placement>` — `{code, enabled}`
- `home:sections` — homepage section order + pinned title ids (admin Content)

## R2 layout (bucket `posters`, public via custom domain or r2.dev for test)

- `poster/<title_id>_w185.webp`, `poster/<title_id>_w500.webp`
- `backdrop/<title_id>_w300.webp` (detail page only, optional)
- `profile/<person_id>_w185.webp`
- `logo/<provider_id>.png|webp` (provider logos, small)
- `site/logo.webp` (site logo from admin)

## Rules

- Slugs: lowercase, ASCII, `-` separated, `<name>-<year>` for titles; on collision append `-<tmdb_id>`. Slugs NEVER change after creation (SEO) — title renames update `title`, not `slug`.
- `quality_gate = 1` only when: poster exists AND overview length ≥ 80 chars AND popularity ≥ site threshold (config, default tuned in sync) AND (cast count ≥ 3 OR providers exist). Sitemaps and `/on/` pages include gated titles only; detail pages still render for ungated titles (noindex).
- Deletes: TMDb removals are rare; sync marks missing-from-changes titles untouched (changes only reports updates). A monthly reconciliation (P3) can flag vanished IDs — do not delete rows on a single failed fetch.
