# START HERE — How to use this package with ChatGPT Codex

**Package v3 (2026-11-09)** — v3 adds the complete admin suite: `docs/ADMIN-PANEL.md` specifies 16 modules (Dashboard, Not-working report, Tracking, Titles & People with sync-proof field locks, Homepage & Categories, Links Pro, Ads & Income, Sync & Data, SEO Center, Media Files, Pages & Requests, Alerts & Reports, Users & Access with roles, Change Log/Trash/Backup, Settings & Health, Tools) with universal powers on every list (search/filter/sort/CSV, bulk edit, 30-day trash, scheduling, per-item stats) — phased P1 core / P2 complete, with its honest analytics limits written down.
**Package v2 (2026-11-09)** — hybrid static pre-build for top pages (free-limit shield), CI speed gate, instant-feel prefetch, production image rules, originality content + full meta/schema set (with the Google ratings-markup fix), OG share cards, poster-colour design, admin purge-on-save/Undo/SEO tab/free-limit meter, daily backups.
If you already unzipped an older version, replace the whole folder with this one — the prompts and task list already include everything.

This zip is a complete build package for the Movie System website. Everything Codex needs is inside: the PRD, the architecture, the database schema, the design spec, and ready-to-paste prompts in build order.

## Steps

1. Unzip this folder. It becomes your project folder (`screenpeek-codex/`).
2. Create a GitHub repo from it later (Codex can do this in Phase 1, Task 1) — or open the folder first, your choice.
3. Open the folder in Codex (desktop app, CLI, IDE extension — or open the GitHub repo in Codex Cloud).
4. Codex automatically reads `AGENTS.md` — the project brain. Do not delete it.
5. The prompts live in the separate **copy-paste zip**. Paste file `1-paste-first-master.md` — it tells Codex to read the PRD + docs in this folder — then paste file `2-paste-phase1-build.md` to build **Phase 1 only**, task by task from `TASKS.md`, stopping for your approval at each checkpoint.
6. When Phase 1 is verified working, paste file `3-paste-phase2-growth.md`. Then later file `4-paste-phase3-scale.md`.
7. Any time something looks off, paste file `5-paste-anytime-qa-audit.md` — it audits the build against the PRD and the hard rules.

## What YOU must supply (Codex will ask; nothing secret is in this zip)

- **TMDb API key** (free, from themoviedb.org — test phase; put it in `.env`, never in code). See `templates/.env.example`.
- **Cloudflare account** (free) — for Pages hosting, D1 database, KV, R2 storage.
- **GitHub account** — repo + the daily sync runs on GitHub Actions.
- **Adsterra placement codes** — later; the build uses clearly-marked placeholders until you paste real codes into the admin panel.
- **Site name — DECIDED: ScreenPeek** (domain `screenpeek.io` chosen, purchase deferred by the owner). Until the domain is bought, the site runs on the free `*.pages.dev` address; use "ScreenPeek" as the site name everywhere (config default, titles, meta).

## The 5 rules that must never break (also in AGENTS.md)

1. Visitors never trigger a TMDb API call. Data comes only from the daily sync.
2. Own page weight: first screen ≤ ~100 KB (ads excluded — they load from Adsterra's servers).
3. Legal info-only site: no download buttons, no fake server/player buttons, no forced-click or auto-click tricks.
4. Every link and ad code is controlled from the admin panel — never hard-coded.
5. Popunder: maximum 1 per visitor session, never on Where-to-Watch outbound clicks.
