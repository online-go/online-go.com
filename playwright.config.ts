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
import { checkLastRunTime } from "./e2e-tests/global-teardown";

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

if (!process.env.TEST_WORKER_INDEX && !process.env.PW_UI) {
    // Stuff we want to do before Playwright gets going...

    console.log("Environment configuration:", {
        FRONTEND_URL,
        CI: process.env.CI,
    });

    if (process.env.CI) {
        console.log("Running in CI mode: SMOKE TESTS ONLY");
    } else {
        console.log("Running in local mode: FULL TEST SUITE (except smoketests)");
    }

    // This chicanery is all due to OGS having a 20 char limit on usernames :p
    // That limits the resolution of unique test users based on time, so we need to
    // make sure we don't run more tests closer together than 60 seconds.

    checkLastRunTime()
        .then(() => {
            console.log("Last run time check completed");
        })
        .catch((err) => {
            console.error("Error checking last run time:", err);
        });
}

export default defineConfig({
    globalTeardown: "./e2e-tests/global-teardown.ts",
    testDir: "./e2e-tests",
    testMatch: process.env.CI ? ["smoketests.spec.ts"] : ["**/*.spec.ts", "!**/smoketests/**"],
    timeout: 120 * 1000, // overall test timeout - we have some long multi-user tests
    expect: {
        timeout: process.env.CI ? 30000 : 10000,
    },

    /* Run tests in files in parallel */
    // We currently need this to be false for full e2e suite due to contention for the reports centre
    // Fully parallel in the CI makes tests time out - everything gets too slow.
    fullyParallel: false, //process.env.CI ? true : false,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    retries: 0, // we want to be stable, not retrying

    /* Opt out of parallel tests on CI. */
    // TBD UNCOMMENT
    //workers: process.env.CI ? 1 : undefined,

    workers: 1, // for test development consider 1, easier to debug

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

    /* Run a local dev server before starting the tests */
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
