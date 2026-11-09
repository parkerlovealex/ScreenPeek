/// <reference types="astro/client" />
type Runtime = import('@astrojs/cloudflare').Runtime<{
  DB: D1Database;
  CONFIG: KVNamespace;
  POSTERS: R2Bucket;
  SITE_NAME?: string;
  SITE_URL?: string;
  ADS_ENABLED?: string;
}>;
declare namespace App {
  interface Locals extends Runtime {}
}
