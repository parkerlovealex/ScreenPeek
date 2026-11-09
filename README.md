# ScreenPeek

Movie and TV information system. Read `AGENTS.md`, `PRD.md`, `docs/`, and
`TASKS.md` before changing the implementation. Phase 1 is in progress.

## Local development

Use Node 24 (minimum 22.12). Run `npm ci`, then `npm run dev`.
`npm run typecheck` checks TypeScript and Astro templates; `npm run build`
produces the Cloudflare Pages SSR output in `dist/`.
`npm run preview` serves the built application with local Cloudflare bindings.

`npm run test:scaffold` runs the production browser smoke test after building.
It uses system Chromium by default; set `CHROMIUM_PATH` to another executable.

Tool caches and local Cloudflare state stay in ignored directories. Keep real
credentials in ignored `.env` / `.dev.vars` files or platform settings, never Git.

The current legacy Pages adapter has dependency audit findings; do not deploy
it until the hosting/version decision is resolved. See `VERIFICATION.md` and
`docs/DECISIONS.md`. Nothing has been deployed or pushed.
