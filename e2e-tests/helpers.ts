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
    page: async ({ page }, use) => {
        await use(page); // eslint-disable-line react-hooks/rules-of-hooks
        if (!page.isClosed()) {
            await checkNoErrorBoundaries(page);
        }
    },
    createContext: async ({ browser }, use) => {
        const contexts: BrowserContext[] = [];

        const factory = async (options?: CreateContextOptions) => {
            const context = await browser.newContext(options);
            contexts.push(context);
            return context;
        };

        try {
            await use(factory); // eslint-disable-line react-hooks/rules-of-hooks
            for (const context of contexts) {
                for (const page of context.pages()) {
                    await checkNoErrorBoundaries(page);
                }
            }
        } finally {
            await Promise.all(contexts.map((context) => context.close()));
        }
    },
});
