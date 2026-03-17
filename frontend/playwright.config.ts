import { defineConfig, devices } from '@playwright/test';

const liveApi = process.env.PLAYWRIGHT_LIVE_API === 'true';

const frontendWebServer = {
  command: 'npm run start -- --host 127.0.0.1 --port 4200',
  url: 'http://127.0.0.1:4200',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
};

const backendWebServer = {
  command: 'npm --prefix ../backend run start:e2e',
  url: 'http://127.0.0.1:3000/api/health',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: liveApi ? [backendWebServer, frontendWebServer] : frontendWebServer,
});
