# Implementation decisions

- Owner confirmed coral `#FF5A5F` on 2026-11-09.
- Owner confirmed the static tier remains static. Ad/content/config changes on static pages appear after the next build; purging alone cannot update their HTML. SSR pages apply saves immediately after successful purge. Admin must state this distinction and must not claim static changes are live before rebuilding.
- Owner approved migration from Cloudflare Pages to **Cloudflare Workers with static assets** on 2026-11-09. Current Astro/Cloudflare versions removed Pages support; the older Pages-compatible dependency line reports critical/high advisories. Use the maintained Astro 7 / Cloudflare adapter 14 stack. The rest of the technology choices and numbered hard rules are unchanged. Original Pages deployment instructions in supplied documents are superseded by this decision.
- Static assets should bypass Worker execution. Keep the existing conservative 15,000-file build safety cap even though its original rationale was the Pages limit. Do not change a Cloudflare plan or incur charges without approval.
- Phase 1 enforces server-side roles as AGENTS.md requires; the complete user management interface remains Phase 2.
- The three named public interactive endpoints do not exclude the expressly required admin handlers, SSR catalogue routes, or dynamic sitemaps. These also consume Functions requests.
- Watch pages stay SSR to respect visitor country; static title pages use the launch fallback country and link to the localised watch page.
- Owner selected **best-effort buffered counters**, labelled **approximate**, instead of adding Durable Objects. Keep D1 writes batched. Memory can be lost on isolate shutdown; KV is not an atomic counter. Visibility within 60 seconds is a healthy-service target, not a durability guarantee. Do not claim exact counts or add Durable Objects without a new owner instruction.

- Owner approved a small image visibility observer with a no-JavaScript image fallback to meet the first-screen byte budget. This is an explicit exception to the design document’s allowed-JavaScript list.

- Owner deferred purchase of ScreenPeek.io and all deployment setup until after Phase 1. Leave 1.26 unchecked with code complete; continue remaining tasks after recording live account/domain/credential checks in VERIFICATION.md.
