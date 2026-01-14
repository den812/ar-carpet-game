/** e2e/showRoads.spec.js — v11.3.1 */
import { test, expect } from '@playwright/test';

test('toggle roads overlay', async ({ page }) => {
  await page.goto('/');
  const btn = page.getByRole('button', { name: /toggle roads/i });
  await expect(btn).toBeVisible();
  await btn.click();
  const overlay = page.locator('#roads');
  await expect(overlay).toBeVisible();
});
