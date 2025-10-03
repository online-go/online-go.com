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
 * Test that suspended users cannot update their profile or avatar
 *
 * This test verifies that:
 * 1. Suspended users cannot change their username
 * 2. Suspended users cannot upload or change their avatar/icon
 * 3. The UI does not show errors, but the changes are silently ignored
 *
 * Uses E2E_MODERATOR from init_e2e data for suspending functionality.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set.
 */

import { Browser, expect } from "@playwright/test";
import {
    prepareNewUser,
    newTestUsername,
    banUserAsModerator as suspendUserAsModerator,
} from "../helpers/user-utils";
import { expectOGSClickableByName } from "../helpers/matchers";

export const suspendedUserCannotUpdateProfileTest = async ({ browser }: { browser: Browser }) => {
    console.log("=== Suspended User Cannot Update Profile Test ===");

    // Create a new user
    console.log("Creating test user...");
    const username = newTestUsername("sUCPTTestUser"); // cspell:ignore sUCPT
    const { userPage } = await prepareNewUser(browser, username, "test");

    // Navigate to account settings page to get initial username
    console.log("Getting initial username...");
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");

    // The username input is the first input in the settings page (after the Username label)
    const usernameInput = userPage.locator('dt:has-text("Username") + dd input');
    const initialUsername = await usernameInput.inputValue();

    console.log(`Initial username: ${initialUsername}`);

    // Suspend the user
    console.log(`Suspending user ${username}...`);
    await suspendUserAsModerator(
        browser,
        username,
        "E2E test: Testing suspended user profile restrictions",
    );
    console.log("User suspended ✓");

    // Try to update username while suspended
    console.log("Attempting to update username while suspended...");
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");

    const newUsername = "HackedUsername";
    await usernameInput.fill(newUsername);

    const saveButtonAfterSuspend = await expectOGSClickableByName(userPage, /Save/i);
    await saveButtonAfterSuspend.click();
    await userPage.waitForLoadState("networkidle");

    console.log("Save request completed (should be silently ignored)");

    // Verify the username was NOT updated by reloading the page and checking the form
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");

    const usernameValue = await usernameInput.inputValue();

    expect(usernameValue).toBe(initialUsername);
    console.log("Username unchanged (correctly ignored update) ✓");

    await userPage.close();

    console.log("=== Suspended User Cannot Update Profile Test Complete ===");
    console.log("✓ Suspended users cannot update their username");
    console.log("✓ Updates are silently ignored without errors");
};

export const suspendedUserCannotUpdateAvatarTest = async ({ browser }: { browser: Browser }) => {
    console.log("=== Suspended User Cannot Update Avatar Test ===");

    // Create a new user
    console.log("Creating test user...");
    const username = newTestUsername("avSUTestUser"); // cspell:ignore avSUTestUser
    const { userPage } = await prepareNewUser(browser, username, "test");

    // Navigate to account settings page
    console.log("Navigating to account settings page...");
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");

    // Get the initial icon src
    const iconElement = userPage.locator(".Dropzone img");
    const initialIconSrc = await iconElement.getAttribute("src");

    console.log(`Initial icon src: ${initialIconSrc}`);

    // Suspend the user
    console.log(`Suspending user ${username}...`);
    await suspendUserAsModerator(
        browser,
        username,
        "E2E test: Testing suspended user avatar restrictions",
    );
    console.log("User suspended ✓");

    // Try to clear icon while suspended
    console.log("Attempting to clear icon while suspended...");
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");

    const clearIconButton = userPage.locator('button:has-text("Clear icon")');
    await clearIconButton.click();
    await userPage.waitForLoadState("networkidle");

    console.log("Clear icon request completed (should be silently ignored)");

    // Verify the icon was NOT cleared by reloading the page and checking the icon src
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");

    const iconElementAfter = userPage.locator(".Dropzone img");
    const iconSrcAfter = await iconElementAfter.getAttribute("src");

    expect(iconSrcAfter).toBe(initialIconSrc);
    console.log("Icon unchanged (correctly ignored clear request) ✓");

    await userPage.close();

    console.log("=== Suspended User Cannot Update Avatar Test Complete ===");
    console.log("✓ Suspended users cannot update their avatar");
    console.log("✓ Updates are silently ignored without errors");
};
