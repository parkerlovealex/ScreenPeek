# Implementation decisions

- Owner confirmed coral `#FF5A5F` on 2026-11-09.
- Owner confirmed the static tier remains static. Ad/content/config changes on static pages appear after the next build; purging alone cannot update their HTML. SSR pages apply saves immediately after successful purge. Admin must state this distinction and must not claim static changes are live before rebuilding.
- The stack stays on Cloudflare Pages. Astro 5 with Cloudflare adapter 12 targets Pages; do not upgrade to a Workers-only adapter without owner approval.
- Phase 1 enforces server-side roles as AGENTS.md requires; the complete user management interface remains Phase 2.
- The three named public interactive endpoints do not exclude the expressly required admin handlers, SSR catalogue routes, or dynamic sitemaps. These also consume Functions requests.
- Watch pages stay SSR to respect visitor country; static title pages use the launch fallback country and link to the localised watch page.
