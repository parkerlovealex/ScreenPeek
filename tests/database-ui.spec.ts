import { test, expect } from '@playwright/test';

test('the Worker reads the 50-title sample catalogue from its actual local D1 binding', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const externalRequests: string[] = [];
  page.on('request', request => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname)) externalRequests.push(request.url());
  });
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('.notice')).toContainText('50 catalogue titles (30 movies, 20 series)');
  await expect(page.locator('.notice')).toContainText('synthetic');
  expect(externalRequests).toEqual([]);
});
