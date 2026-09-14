import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  forbidOnly: Boolean(process.env.CI),
  webServer: process.env.CI ? {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 30000,
  } : undefined,
  use: {
    baseURL: process.env.GAME_URL || 'http://127.0.0.1:5173',
    browserName: 'chromium',
    viewport: { width: 1100, height: 1000 },
    screenshot: 'only-on-failure',
  },
});
