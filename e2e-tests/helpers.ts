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

import { test as base, type Page } from "@playwright/test";

export async function checkNoErrorBoundaries(page: Page) {
    const errorBoundaryCount = await page.locator(".ErrorBoundary").count();
    if (errorBoundaryCount > 0) {
        throw new Error("Found that an ErrorBoundary was rendered.  Test fails.");
    }
}

// Our customisation is to make sure that no ErrorBoundary is rendered in all tests (that use this fixture)

export const ogsTest = base.extend({
    page: async ({ page }, use) => {
        // dumb linter - thinks this is a hook.
        await use(page); // eslint-disable-line react-hooks/rules-of-hooks
        await checkNoErrorBoundaries(page);
    },
});

export async function login(page: Page, username: string, password: string) {
    await page.click("text=Sign In");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
}
