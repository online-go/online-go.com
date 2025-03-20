/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */

// Load from environment or use defaults
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

export default defineConfig({
    testDir: "./e2e-tests",
    testMatch: ["**/*.spec.ts"],
    timeout: 120 * 1000, // overall test timeout - we have some long multi-user tests
    expect: {
        timeout: process.env.CI ? 30000 : 5000,
    },

    /* Run tests in files in parallel */
    //fullyParallel: true,
    fullyParallel: false, // for test development, easier to debug
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI. */
    // TBD UNCOMMENT
    //workers: process.env.CI ? 1 : undefined,

    workers: 1, // for test development, easier to debug

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        //
        // ['html'],
        ["list"], // Shows real-time line-by-line test execution in the console
        //['dot']    // Shows a compact view of test progress
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: FRONTEND_URL,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "retain-on-failure",
        video: "retain-on-failure",
        screenshot: "only-on-failure",
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },

        /* commented out while developing tests TBD UNCOMMENT
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
*/
        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
        {
            name: "setup",
            testMatch: /.*\.setup\.ts/,
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: process.env.FRONTEND_URL
        ? undefined
        : {
              command: `echo "Starting vite server: ${process.env.OGS_BACKEND}" && yarn vite`,
              url: FRONTEND_URL,
              reuseExistingServer: !process.env.CI,
              timeout: 120 * 1000, // server startup.
              stdout: "pipe",
              stderr: "pipe",
          },
});
