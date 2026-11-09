import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:8788',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run preview -- --port 8788',
    url: 'http://127.0.0.1:8788',
    reuseExistingServer: !process.env.CI,
    env: {
      XDG_CONFIG_HOME: resolve('.cache/config'),
      WRANGLER_SEND_METRICS: 'false',
    },
  },
});
