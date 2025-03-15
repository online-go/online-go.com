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

import { expect } from "@playwright/test";

import { ogsTest } from "@helpers";
import { expectOGSClickableByName } from "@helpers/matchers";

ogsTest.describe("@Smoke Register, logout, login", () => {
    const testInfo = {
        newUsername: `SmokeRegister_${Date.now().toString(36).slice(-6)}`,
    };

    ogsTest.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    ogsTest("Should be able to register, logout, login", async ({ page }) => {
        // Go from "landing page" to the "sign in" page.
        await page.getByRole("link", { name: /sign in/i }).click();
        await expect(page.getByLabel("Username")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await expectOGSClickableByName(page, /Sign in$/);

        // From there to "Register"
        const registerPageButton = await expectOGSClickableByName(page, /Register here!/);
        await registerPageButton.click();

        // Fill in registration form
        await page.getByLabel("Username").fill(testInfo.newUsername);
        await page.getByLabel("Password").fill("test");
        const registerButton = await expectOGSClickableByName(page, /Register$/);
        await registerButton.click();

        // Verify successful registration
        await expect(page.getByText("Welcome")).toBeVisible();

        const userDropdown = page.locator(".username").getByText(testInfo.newUsername);
        await expect(userDropdown).toBeVisible();

        // Log out...
        await userDropdown.click();

        const logoutButton = await expectOGSClickableByName(page, /Sign out$/);

        await logoutButton.click();

        // Logout causes the username to disappear
        // (in the old layout it appears in two places)
        await expect(
            page.locator(".username").getByText(testInfo.newUsername).first(),
        ).toBeHidden();
        const signInLink = await expectOGSClickableByName(page, /Sign in$/);

        // Log back in again
        await signInLink.click();

        await expect(page.getByLabel("Username")).toBeVisible();
        await expect(page.getByLabel("Password")).toBeVisible();
        await page.getByLabel("Username").fill(testInfo.newUsername);
        await page.getByLabel("Password").fill("test");
        const signInButton = await expectOGSClickableByName(page, /Sign in$/);
        await signInButton.click();

        await expect(page.locator(".username").getByText(testInfo.newUsername)).toBeVisible();
    });
});
