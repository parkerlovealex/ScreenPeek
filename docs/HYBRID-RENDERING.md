# Hybrid rendering (Phase 1)

`npm run build` builds the Astro Worker, takes a read-only catalogue snapshot, and renders selected HTML with the same Worker locally. It stages HTML outside the asset directory until rendering finishes. Build failure stops deployment. `dist/static-manifest.json` records the public inventory, mode, source sample flag and asset count; it is outside the public assets.

## Inventory and limits

Static assets include home, the first page of movies/series/new/top10/upcoming, populated genre/collection/language hubs, four trust pages, and the top visible gated titles ordered by popularity. Owner Settings controls `static_top_n` (default 3000, range 0–15000). All assets together must fit 15000 files; a lower title setting may be necessary as hubs grow. The build checks before and after rendering. It refuses non-200 HTML or responses carrying visitor cookies.

Watch, search, admin, APIs, redirects and My List are never frozen. Remaining catalogue routes render from the live database. A temporary local D1 holds card fields for visible eligible titles plus full metadata and related rows only for selected top titles. The snapshot excludes admin users, logs and inboxes. Bounded keyset reads fail rather than truncate an oversized catalogue. Temporary data is removed after rendering. Production builds refuse sample markers.

## Local and nightly builds

Prepare the local database with `npm run db:setup`, then `npm run build`. Sample HTML is clearly labelled and noindex. Fixture builds do not fetch TMDb or require credentials.

The guarded nightly workflow runs sync → read-only remote snapshot → build → deploy → cache purge. Its build step uses `STATIC_SOURCE_REMOTE=1`, `DEPLOYMENT_ENV=production`, secure Cloudflare account/API token/D1 ID, and public SITE_URL/R2_PUBLIC_BASE/ADS_ENABLED settings. These are not browser credentials. Deployment stays disabled until the owner supplies resources, enables it, and every Phase 1 task is verified. Production preparation rejects preview/sample inventories and mismatched public URLs or ad enable flags. Never promote a local sample build by changing only the deployment mode.

## Routing and caching

The Worker asset binding has `run_worker_first=false`: existing HTML assets bypass the application. Local integration tests instrument only the test Worker to prove the bypass; long-tail requests enter it. Static ad/content edits take effect at the next build, as approved by the owner. Runtime saves still mirror KV and request a purge for SSR responses.

Pagination uses `/movies/page/2/` and equivalent hub paths. Filter forms use `/movies/filter/?genre=…`, which remains dynamic, private/no-store and noindex. Jump forms redirect to clean page URLs without JavaScript. Type aliases also redirect to the clean form. Static hosting ignores query strings: manually entering an old query on a static root does not filter that HTML. Before production, the custom domain needs the query redirect/noindex rules documented with task 1.28. Generated links and forms already use the correct paths.

Long-tail public HTML uses the Cache API with 1h list / 24h detail TTLs. Filtered, private, cookie-bearing, non-GET and error responses are excluded. Watch HTML has a separate path+country key, strips the country cookie before storage and sets it afresh on cache hits; outward responses remain private/no-store. Cache failures fall back to rendering. Purge requires the owner's zone credentials; outages remain visible in the admin delivery log.

**Platform correction to the supplied Pages-era wording:** Cache API hits still enter the Worker. Response cache headers and a custom-domain Cache Rule do not establish that Worker requests are free or bypass execution. Only the static asset tier has the tested bypass. Treat the Workers free request allowance as a remaining production capacity constraint. Cache API TTL expiry performs a fresh render; the outward stale-while-revalidate hint is not an automatic background refresh inside this cache. Real Cloudflare billing, CDN rules and remote snapshot quota usage need credentialed validation.

## Local verification

Task 1.23: build prints 15 sample HTML pages / 21 total assets; actual D1 and instrumented local Worker tests verify two gated static titles, live long-tail rendering/cache hits, no-JavaScript filter and pagination routes, country-isolated Watch cache hits, excluded private data and production sample rejection. Five hybrid tests, 51 catalogue tests, five deployment guard tests, two SEO tests and 38 browser checks passed; typecheck and actionlint passed. File-budget negative probe rejects 15001. Live remote snapshots, deployment/purge and billing are unrun without owner credentials.
