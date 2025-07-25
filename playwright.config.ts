import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', 
  fullyParallel: false, 
  forbidOnly: !!process.env.CI, 
  retries: process.env.CI ? 2 : 0, 
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html', 
  timeout: 60000,

  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    viewport: null, 
    launchOptions: {
      slowMo: 750, 
      headless: false, 
      
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});