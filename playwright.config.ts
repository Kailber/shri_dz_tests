import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './src',
    testMatch: '**/*.e2e.test.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
},

  /* Configure projects for major browsers */
projects: [
    {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    },

    {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
    },

    {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
    },
],

  /* Run your local dev server before starting the tests */
webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
},
});
