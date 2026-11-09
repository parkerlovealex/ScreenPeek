# Image delivery verification (task 1.26)

Local implementation is prepared; live custom-domain verification is blocked on owner resources. Keep task 1.26 unchecked until the live response passes.

The sync pipeline uploads hashed immutable WebP objects with `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable`. Source image replacements produce new keys. All public image templates include explicit width/height, and local Lighthouse reports CLS 0 on home/detail/list. Production preparation refuses service image hostnames and requires an owned R2 custom domain.

Owner steps:

1. In the existing Cloudflare account, connect an owned hostname to the posters bucket under R2 → Settings → Custom Domains. Domain purchase or any paid plan requires separate approval.
2. Set R2_PUBLIC_BASE to that HTTPS hostname through secure configuration. Keep credentials out of chat and source files.
3. After uploading an image through sync, run `node --use-env-proxy scripts/verify-image-delivery.mjs https://YOUR-IMAGE-HOST/poster/ACTUAL-KEY.webp`. This is a read-only HEAD check; redirects fail.
4. Confirm the real image loads, check its immutable headers, then repeat the image/layout/browser checks on the production host. Do not mark the live custom-domain check passed using the local HTTPS test fixture.

The existing local tests verify encoded WebP dimensions, upload metadata, signed R2 transport and image loading with/without JavaScript. No cloud bucket, custom domain, DNS record or paid resource has been created by the agent.
