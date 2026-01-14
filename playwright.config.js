// Playwright config — v11.3.1 (ESM)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',                // <-- e2e в корне репо
  fullyParallel: true,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
