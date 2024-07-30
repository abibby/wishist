import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    // Look for test files in the "tests" directory, relative to this configuration file.
    testDir: '__tests__',

    // Run all tests in parallel.
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    // Retry on CI only.
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI.
    workers: process.env.CI ? 1 : undefined,

    // Reporter to use
    reporter: 'html',

    // timeout: 3000,

    use: {
        // Base URL to use in actions like `await page.goto('/')`.
        baseURL: 'http://127.0.0.1:32148',

        // Collect trace when retrying the failed test.
        trace: 'on-first-retry',
    },
    // Configure projects for major browsers.
    projects: [
        {
            name: 'Desktop Chrome',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'iOS Safari',
            use: { ...devices['iPhone SE'] },
        },
    ],
    // Run your local dev server before starting the tests.
    webServer: {
        command: 'make run-test',
        cwd: '..',
        url: 'http://127.0.0.1:32148',
        reuseExistingServer: !process.env.CI,
        env: {
            APP_KEY: 'test-secret',
            MAIL_FROM: '',
            MAIL_HOST: '',
            MAIL_PORT: '',
            MAIL_USERNAME: '',
            MAIL_PASSWORD: '',
            DB_PATH: `./test-${Date.now()}.sqlite`,
        },
    },
})
