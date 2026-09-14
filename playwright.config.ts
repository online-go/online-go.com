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
import { arch, availableParallelism, cpus, platform, totalmem } from "node:os";

const smoke = !!process.env.CI;
const workers = process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 1;
const hostMemory = totalmem();
const memoryLimit = process.constrainedMemory?.() || 0;
if (!Number.isInteger(workers) || workers < 1) {
    throw new Error("E2E_WORKERS must be a positive integer");
}

export default defineConfig({
    testDir: "./e2e-tests",
    testMatch: smoke ? ["smoketests.spec.ts"] : ["**/*.spec.ts"],
    testIgnore: smoke ? [] : ["**/smoke/**"],
    // Utility tests (@E2EUtils) are operator tools, not checks; they never
    // run by default. E2E_INCLUDE_UTILS=1 (set by `yarn test:e2e:util`)
    // makes them selectable with --grep.
    grepInvert: process.env.E2E_INCLUDE_UTILS ? /@Manual|@Visual/ : /@Manual|@Visual|@E2EUtils/,
    timeout: 180_000,
    expect: { timeout: smoke ? 30_000 : 15_000 },
    fullyParallel: !smoke,
    forbidOnly: !!process.env.CI || !!process.env.E2E,
    retries: 0,
    workers,
    metadata: {
        runtime: {
            node: process.version,
            platform: platform(),
            architecture: arch(),
            cpu: cpus()[0]?.model,
            hostLogicalCpus: cpus().length,
            availableLogicalCpus: availableParallelism(),
            hostMemoryGiB: hostMemory / 1024 ** 3,
            constrainedMemoryGiB:
                memoryLimit > 0 && memoryLimit < hostMemory ? memoryLimit / 1024 ** 3 : null,
            apiDelayMs: Number(process.env.E2E_API_DELAY_MS || 0),
        },
    },
    reporter: [["list"], ["json", { outputFile: "test-results/e2e-results.json" }]],
    use: {
        baseURL: process.env.FRONTEND_URL || "http://localhost:8080",
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
        trace: "retain-on-failure",
        video: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            testIgnore: smoke ? [] : ["**/smoke/**", "**/dev-server/**"],
            use: { ...devices["Desktop Chrome"] },
        },
        ...(!smoke
            ? [
                  {
                      name: "dev-server",
                      testMatch: "**/dev-server/*.spec.ts",
                      use: {
                          ...devices["Desktop Chrome"],
                          baseURL:
                              process.env.E2E_DEV_SERVER_URL ||
                              process.env.FRONTEND_URL ||
                              "http://localhost:8080",
                      },
                  },
              ]
            : []),
    ],
});
