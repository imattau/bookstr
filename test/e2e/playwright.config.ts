import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  timeout: 30 * 1000,
  retries: 0,
  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
