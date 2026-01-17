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
        console.log("Running in CI mode: SMOKE TESTS ONLY (1 worker, no retries, sequential)");
    } else if (process.env.E2E) {
        console.log("Running in E2E mode: FULL TEST SUITE (2 workers, 1 retry)");
    } else {
        console.log("Running in Dev mode: FULL TEST SUITE (2 workers, no retries)");
    }

    // This chicanery is all due to OGS having a 30 char limit on usernames
    // That limits the resolution of unique test users based on time, so we need to
    // make sure we don't run more tests closer together than ~2 seconds.

    checkLastRunTime()
        .then(() => {
            console.log("Last run time check completed");
        })
        .catch((err) => {
            console.error("Error checking last run time:", err);
        });
}

export default defineConfig({
    globalSetup: process.env.PW_UI ? undefined : "./e2e-tests/global-setup.ts",
    globalTeardown: process.env.PW_UI ? undefined : "./e2e-tests/global-teardown.ts",
    testDir: "./e2e-tests",
    testMatch: process.env.CI ? ["smoketests.spec.ts"] : ["**/*.spec.ts"],
    testIgnore: process.env.CI ? [] : ["**/smoke/**"],
    // If you change this you need to change report-utils to match, noting the delta there from here.
    timeout: 180 * 1000, // 3 minutes - longest regular test is ~108s; @Slow tests override with test.setTimeout()
    expect: {
        timeout: process.env.CI ? 30000 : 15000,
    },

    /* Run tests in files in parallel */
    // We currently need this to be false for full e2e suite due to contention for the reports centre
    // Fully parallel in the CI makes tests time out - everything gets too slow.
    fullyParallel: false, //process.env.CI ? true : false,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry configuration by environment */
    // CI: 0 retries (smoke tests should be stable)
    // E2E: 2 retry (handle flakiness in full test suite)
    // Dev: 0 retries (fail fast for development)

    retries: process.env.CI ? 0 : process.env.E2E ? 2 : 0,

    /* Workers configuration for parallel execution */
    // Ideally...
    // CI: 1 worker (sequential for reliability, smoke tests only)
    // E2E: 2 workers (parallel execution with isolation via worker IDs)
    // Dev: 2 workers (parallel execution for faster feedback)

    // But ... it just doesn't work.
    // workers: process.env.CI ? 1 : 1,

    workers: 1, // parallel execution is disabled for stability

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    /* (note that e2etesting run_test override this from command line) */
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
    // Disabled: Server startup is complex (requires backend setup), so we assume
    // the server is already running. Start it manually before running tests.
    webServer: undefined,
});
