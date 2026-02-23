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

/*
 * Test that a suspended user can log in and reach the appeal page
 *
 * This test verifies that:
 * 1. A suspended user who returns to the site can enter their credentials on /sign-in
 * 2. They are redirected to /appeal (not shown a generic error)
 * 3. They see the reason for their suspension
 * 4. They can submit an appeal message
 *
 * This is distinct from mod-suspend-appeal-restore.ts which tests the flow when
 * a user is already logged in when they get suspended. This test covers the case
 * where a suspended user returns later and needs to log in fresh.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";
import {
    newTestUsername,
    prepareNewUser,
    generateUniqueTestIPv6,
    banUserAsModerator,
} from "../helpers/user-utils";
import { expectOGSClickableByName } from "../helpers/matchers";
import { log } from "@helpers/logger";

export const suspendedUserCanLoginToAppealTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Suspended User Can Login To Appeal Test ===");

    const password = "test";
    const banReason = "E2E test: login-to-appeal verification";

    // 1. Create a new user
    const username = newTestUsername("LoginAppeal");
    log(`Creating test user: ${username}`);
    await prepareNewUser(createContext, username, password);
    log(`User created: ${username}`);

    // 2. Suspend the user via moderator
    log(`Suspending user: ${username}`);
    await banUserAsModerator(createContext, username, banReason);
    log(`User suspended`);

    // 3. Open a fresh browser context (simulating the user returning later)
    log("Opening fresh browser context for re-login attempt...");
    const freshContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": generateUniqueTestIPv6(),
        },
    });
    const page = await freshContext.newPage();

    // 4. Navigate to sign-in and enter credentials
    await page.goto("/sign-in");
    await expect(page.getByLabel("Username")).toBeVisible({ timeout: 10000 });

    await page.getByLabel("Username").fill(username);
    await expect(page.getByLabel("Username")).toHaveValue(username);

    await page.getByLabel("Password").fill(password);
    await expect(page.getByLabel("Password")).toHaveValue(password);

    log("Credentials entered, attempting sign-in...");
    await page.getByRole("button", { name: /Sign in$/ }).click();

    // 5. Verify we are redirected to the appeal page
    log("Waiting for redirect to appeal page...");
    await expect(page).toHaveURL(/\/appeal/, { timeout: 15000 });
    log("Redirected to appeal page");

    // 6. Verify the appeal page shows the suspension reason
    await expect(page.getByText(/Your account has been suspended/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(banReason)).toBeVisible();
    log("Suspension reason displayed");

    // 7. Verify the user can submit an appeal
    const appealTextarea = page.locator(".input-card textarea");
    await expect(appealTextarea).toBeVisible();

    const appealMessage = "I would like to appeal my suspension. This is an e2e test.";
    await appealTextarea.fill(appealMessage);
    await expect(appealTextarea).toHaveValue(appealMessage);

    const submitButton = await expectOGSClickableByName(page, /^Submit$/);
    await submitButton.click();

    // Wait for the message to appear in the appeal thread
    await expect(page.getByText(appealMessage)).toBeVisible({ timeout: 10000 });
    log("Appeal message submitted and visible");

    log("=== Suspended User Can Login To Appeal Test Complete ===");
};
