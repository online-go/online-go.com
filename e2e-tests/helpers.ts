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

import { test as base, type Page, type Browser, BrowserContext } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";

const apiDelay = Number(process.env.E2E_API_DELAY_MS || 0);
if (!Number.isInteger(apiDelay) || apiDelay < 0) {
    throw new Error("E2E_API_DELAY_MS must be a non-negative integer");
}

// Export logger utilities
export { createTestLogger, log, setWorkerIndex } from "./helpers/logger";

export async function checkNoErrorBoundaries(page: Page) {
    const errorBoundaryCount = await page.locator(".ErrorBoundary").count();
    if (errorBoundaryCount > 0) {
        throw new Error("Found that an ErrorBoundary was rendered.  Test fails.");
    }
}

export async function load(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState("domcontentloaded");
}

// Type for browser context options - matches Browser.newContext() parameter
export type CreateContextOptions = Parameters<Browser["newContext"]>[0];

// Fixture type for multi-context tests
type MultiContextFixtures = {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
};

// Our customisation is to make sure that no ErrorBoundary is rendered in all tests (that use this fixture)
// Also provides createContext fixture for automatic cleanup of multi-user test contexts
export const ogsTest = base.extend<MultiContextFixtures>({
    page: async ({ page }, use, testInfo) => {
        await use(page); // eslint-disable-line react-hooks/rules-of-hooks
        if (testInfo.status === "passed" && !page.isClosed()) {
            await checkNoErrorBoundaries(page);
        }
    },
    createContext: async ({ browser }, use, testInfo) => {
        const contexts: BrowserContext[] = [];

        const factory = async (options?: CreateContextOptions) => {
            const context = await browser.newContext(options);
            contexts.push(context);
            if (apiDelay) {
                await context.route("**/api/**", async (route) => {
                    const page = route.request().frame().page();
                    await delay(apiDelay);
                    if (!page.isClosed()) {
                        try {
                            await route.continue();
                        } catch (error) {
                            // Navigation or teardown can cancel a request during the injected delay.
                            if (
                                !(
                                    error instanceof Error &&
                                    error.message.includes(
                                        "Target page, context or browser has been closed",
                                    )
                                )
                            ) {
                                throw error;
                            }
                        }
                    }
                });
            }
            return context;
        };

        try {
            await use(factory); // eslint-disable-line react-hooks/rules-of-hooks
            if (testInfo.status === "passed") {
                for (const context of contexts) {
                    for (const page of context.pages()) {
                        await checkNoErrorBoundaries(page);
                    }
                }
            }
        } finally {
            await Promise.all(contexts.map((context) => context.close()));
        }
    },
});
