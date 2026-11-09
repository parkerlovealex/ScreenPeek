# ROUTES & DESIGN

## Route map

| Route | Type | Content | Cache |
|---|---|---|---|
| `/` | home | Hero-lite (no big image): search + Trending row, Top 10 This Week, Latest Movies, Latest Series, Upcoming strip, category grid, genre chips | 1h |
| `/movies/`, `/series/` | list | Filterable catalogue grid (genre, year, rating, sort), 24/page, numbered pagination + page-jump | 1h |
| `/new/` | list | Newest added first (by sync `updated_at`/added order) | 1h |
| `/top10/` | list | Top 10 of the week (popularity delta or popularity) as a ranked list with big rank numbers | 1h |
| `/upcoming/` | list | Future release dates, grouped by month | 1h |
| `/movie/<slug>/` | detail | Anatomy below | 24h |
| `/tv/<slug>/` | detail | Movie anatomy + season list | 24h |
| `/tv/<slug>/season/<n>/` | list | Episode rows (still, number, name, air date) | 24h |
| `/cast/<slug>/` | person | Photo, name, bio (truncated + expand), filmography grid (PosterCards with role under title) | 24h |
| `/genre/<slug>/`, `/collection/<slug>/`, `/language/<slug>/`, `/type/<movie\|tv>/` | list | Themed grids, paginated | 1h |
| `/on/<provider>/` | list | Titles on that provider in visitor's country (P2) | 1h |
| `/watch/<slug>/` | watch | Where to Watch (below) | 24h |
| `/trailer/<slug>/` | trailer | Click-to-load YouTube facade, title summary, similar grid | 24h |
| `/search/?q=` | search | Full results grid + filters; suggestions come from `/api/search` | no-store |
| `/mylist/` | utility | localStorage list + history; empty state with "Browse trending" CTA | no-store |
| `/about/ /privacy/ /dmca/ /contact/` | static | Trust pages; About carries full TMDb attribution text | 24h |
| `/admin/*` | admin | See ADS-AND-ADMIN.md — `noindex`, behind Cloudflare Access | no-store |
| `/go/<slug>` | function | Redirect service (not a page) | no-store |
| `/year/<yyyy>/` | list | Titles released that year, popularity order (P2) | 1h |
| `/movies-like/<slug>/` | list | Full similar-titles page for one title (P2) | 24h |
| `/tv/calendar/` | list | This week's episode air dates, grouped by day (P2) | 1h |

Images: all `<img>` tags carry explicit `width`/`height` (aspect preserved by CSS), `decoding="async"`, and `loading="lazy"` except the first row / detail poster (`fetchpriority="high"`). All image URLs use the R2 **custom domain** with immutable 1-year cache headers — never `r2.dev` or `image.tmdb.org` at runtime.

## Detail page anatomy (fixed order — do not reorder)

1. Breadcrumb (Home / Movies / Title)
2. Poster (w500 R2) + title, year, runtime, certification (visitor country), status
3. **Ratings strip:** TMDb ★ score (labelled "TMDb") · IMDb / RT / Metacritic slots (only when `ratings_external` flag ON, labelled by real source)
4. **Action row:** [Where to Watch → `/watch/<slug>/`] [▶ Trailer → `/trailer/<slug>/`] [+ My List toggle]
5. **"Streaming on" strip:** first 3 provider logos for the visitor's country + "+N more" → links to the watch page (skip silently if no providers)
6. Ad slot: `detail / top_300x250`
7. Info boxes row: Type · Language · Release (local) · Network/Studio · Budget/Revenue if present (movies)
8. Storyline (overview; "Read more" expands in place if long), followed by the **facts line** (one generated sentence from stored data: year · genres · director/creator · runtime · top providers), a **Q&A block** (Where can I watch X? / Who stars in X? / When was X released? — template answers from data, FAQPage schema), and an "Updated <date>" line
- The header band behind the poster carries a soft tint of the poster's dominant colour (`poster_color`); poster `<img>` placeholder background = same colour.
9. **Cast row:** circular w185 profile thumbs, name + character, in a CSS scroll-snap swipe row; "Full cast & crew" is part of the same page section (cast is its own *page step* via person pages, not a tab) — link each person to `/cast/<slug>/`
10. **Community Verdict** widget (4 options + result bars)
11. Ad slot: `detail / native`
12. Gallery: up to 6 backdrop w300 thumbs (detail only; lazy)
13. Seasons block (TV) → season pages
14. **More Like This:** 12 PosterCards (TMDb similar, stored at sync) + "See all movies like <Title>" link → `/movies-like/<slug>/` (P2)
15. Footer (attribution, socials via `/go/`, trust links)
Trending rows on Home use the same scroll-snap swipe pattern as Cast.
Sticky bottom `320×50` + Social Bar come from the base layout on all content pages.

## Where-to-Watch page

- Header: poster thumb + "Where to watch <Title> in <Country>" (country name from geo; small country switcher links US/UK/CA/AU re-render)
- Groups: **Stream / Free / Rent / Buy** — provider logo + name rows; each row is an outbound link: affiliate URL via `/go/prov-<provider_id>` when configured, else the provider's public page (still via `/go/` for counting, destination editable in admin)
- "Not available to stream in <Country> yet" state + "Available in: US, UK…" cross-links when empty for the visitor's country
- JustWatch attribution line directly under the provider groups
- NO popunder on this page's outbound clicks (hard rule); display/native slots still allowed on the page itself

## Design system

- **Theme:** dark, premium, minimal. Background near-black `#0B0B10`, panels `#14141C`, text `#F2F2F5`, muted `#9A9AA5`, one accent (owner picks at build kickoff; default coral red `#FF5A5F`). No gradients-as-decoration, no glassmorphism, no heavy shadows. Radius 10px cards, 8px buttons.
- **Type:** system font stack only (`-apple-system, 'Segoe UI', Roboto, ...`) — zero font downloads. Scale: page title 22–26px, card title 13–14px 2-line clamp, body 15px.
- **PosterCard (the core component):** 2:3 image (R2 w185 WebP, `loading="lazy"` except first row), ★ rating badge top-left (dark pill), type badge top-right (MOVIE / TV), bottom-left year chip on image? No — year in text line under title: `2025 • ★7.8` meta line + views • time-ago when available. Title = 2-line clamp. Whole card is one `<a>`.
- **Header:** logo (text + optional image), search input (suggestions dropdown), nav: Movies · Series · Top 10 · Upcoming · My List. Sticky, slim (≤56px).
- **Grid:** mobile 3 columns (matches competitor muscle memory), tablet 4–5, desktop 6. Gap 10–12px.
- **Buttons:** primary = accent fill (Where to Watch), secondary = outline. Min tap target 40px.
- **Ad placeholders:** every ad slot renders a fixed-size reserved box (exact IAB size) even with no code configured — zero layout shift when codes are added.
- **Accessibility:** alt text on posters (`<title> poster`), aria-labels on icon buttons, focus-visible outlines, suggestions listbox semantics.
- **Performance:** single CSS file; no client framework JS; the only JS allowed: search suggestions, verdict, My List, lazy native `loading` attrs, popunder cap cookie logic (tiny inline). Total JS ≤ 5 KB/page target.

## Copy rules

- English, plain, no hype words ("download", "watch free HD" etc. are banned phrases — this is an info site).
- Meta title templates:
  - Detail: `<Title> (<Year>) — Cast, Trailer & Where to Watch | <SiteName>`
  - Watch: `Where to Watch <Title> (<Year>) in <Country> — Streaming, Rent & Buy | <SiteName>`
  - Trailer: `<Title> (<Year>) Trailer — Official Trailer & Details | <SiteName>`
  - Cast/person: `<Name> — Movies & Shows, Biography | <SiteName>`
  - Season: `<Title> Season <N> — Episodes, Air Dates & Cast | <SiteName>`
  - Genre/taxonomy: `<Genre> Movies & Shows — Best <Genre> Titles to Watch | <SiteName>`
  - Paginated pages (page ≥ 2): append ` — Page <N>` to the title; canonical stays on the paginated URL itself (pagination is crawlable), EXCEPT filter/sort query variants which canonical to the clean URL + `noindex,follow` (see FEATURES #27).
- Description: overview truncated to ~155 chars (detail); template text for other types ("Browse the best <genre> movies…", "See where <Title> is streaming in <Country>…").
- Footer on every page: "This product uses the TMDB API but is not endorsed or certified by TMDB." + TMDB logo; provider sections: "Streaming data by JustWatch."
