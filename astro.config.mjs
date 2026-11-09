import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.pages.dev',
  output: 'server',
  trailingSlash: 'always',
  adapter: cloudflare({ imageService: 'passthrough', sessionKVBindingName: 'CONFIG' }),
  build: { inlineStylesheets: 'never' },
  vite: { build: { cssCodeSplit: false } },
});
