/** e2e/a11y.e2e.spec.js — v11.3.1 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home has no serious/critical a11y issues', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a','wcag2aa'])
    .analyze();
  const severe = results.violations.filter(v => ['serious','critical'].includes(v.impact));
  expect(severe).toEqual([]);
});
