# Filter URL controls (task 1.28)

Generated filter forms target dynamic `/movies/filter/` or `/series/filter/`. Filter responses have noindex,follow, a canonical pointing to the clean hub, and private/no-store cache policy. Clean pagination uses `/page/N/`. Empty jump/filter requests redirect to clean pagination. Filters never enter the static inventory or sitemaps.

## Deferred custom-domain rule

Static assets bypass the Worker and ignore query strings. Before launch, configure a Cloudflare Single Redirect rule on the owned site domain for clean hub paths carrying genre/year/rating/sort/page query parameters. Restrict it to the hub roots (`/movies/`, `/series/`, `/new/`, `/top10/`, `/upcoming/` and taxonomy roots), excluding paths already ending in `/filter/` or containing `/page/`.

Redirect to the same HTTPS host and path with `filter/` appended; enable Preserve query string. Use starts_with/ends_with/path sets and query-argument presence rather than paid regular-expression operators. The dynamic handler redirects pagination-only requests to clean page paths; filter requests render noindex. Add an HTTP response-header rule for requests containing genre/year/rating/sort: X-Robots-Tag = noindex, follow, including static-root requests. Verify both behaviours on the production domain.

This rule is not installed locally: owner deferred domain purchase and deployment setup. Generated routes, form submission and canonical/noindex behaviour are tested locally; old manually entered query URLs on static roots require this deferred rule. A purge cannot alter static HTML.
