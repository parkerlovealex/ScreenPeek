/// <reference types="astro/client" />
interface ScreenPeekBindings {
  DB: D1Database;
  CONFIG: KVNamespace;
  POSTERS: R2Bucket;
  SITE_NAME?: string;
  SITE_URL?: string;
  ADS_ENABLED?: string;
  ASSETS: Fetcher;
}
interface Env extends ScreenPeekBindings {}
declare namespace Cloudflare {
  interface Env extends ScreenPeekBindings {}
}
type Runtime = import('@astrojs/cloudflare').Runtime;
declare namespace App {
  interface Locals extends Runtime {}
}
