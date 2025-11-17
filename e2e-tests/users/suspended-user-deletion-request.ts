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
 * Test that suspended users see "Deletion request" button instead of "Delete account"
 *
 * This test verifies that:
 * 1. Normal users see "Delete account" button in account settings
 * 2. Suspended users see "Deletion request" section title instead of "Delete account"
 * 3. Suspended users see appropriate warning text about using appeal system
 * 4. Suspended users see a "Deletion request" link/button that goes to /appeal
 * 5. Clicking the "Deletion request" button navigates to the appeal page
 *
 * Uses E2E_MODERATOR from init_e2e data for suspending functionality.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set.
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";
import {
    prepareNewUser,
    newTestUsername,
    banUserAsModerator as suspendUserAsModerator,
} from "../helpers/user-utils";
import { log } from "@helpers/logger";

export const suspendedUserDeletionRequestTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Suspended User Deletion Request Test ===");

    // 1. Create a new user and verify normal "Delete account" button
    log("Creating test user...");
    const username = newTestUsername("DelReqTest");
    const { userPage } = await prepareNewUser(createContext, username, "test");
    log(`User created: ${username} ✓`);

    // 2. Navigate to account settings and verify normal state
    log("Navigating to account settings...");
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");
    log("Account settings loaded ✓");

    // 3. Verify "Delete account" section title for normal user
    const deleteAccountHeading = userPage.locator('dt:has-text("Delete account")');
    await expect(deleteAccountHeading).toBeVisible();
    log("'Delete account' section visible for normal user ✓");

    // 4. Verify warning text for normal user
    const normalWarningText = userPage.getByText(
        /Warning: this action is permanent, there is no way to recover an account/i,
    );
    await expect(normalWarningText).toBeVisible();
    log("Normal warning text visible ✓");

    // 5. Verify "Delete account" button exists for normal user
    const deleteAccountButton = userPage.locator('button.reject:has-text("Delete account")');
    await expect(deleteAccountButton).toBeVisible();
    log("'Delete account' button visible for normal user ✓");

    // 6. Suspend the user
    log(`Suspending user ${username}...`);
    await suspendUserAsModerator(
        createContext,
        username,
        "E2E test: Testing deletion request button for suspended users",
    );
    log("User suspended ✓");

    // 7. Wait for suspension to take effect
    await userPage.waitForTimeout(1000);
    await userPage.waitForLoadState("networkidle");
    log("User page reloaded after suspension");

    // 8. Navigate back to account settings
    log("Navigating to account settings as suspended user...");
    await userPage.goto("/settings/account");
    await userPage.waitForLoadState("networkidle");
    log("Account settings loaded for suspended user ✓");

    // 9. Verify "Deletion request" section title for suspended user
    const deletionRequestHeading = userPage.locator('dt:has-text("Deletion request")');
    await expect(deletionRequestHeading).toBeVisible();
    log("'Deletion request' section visible for suspended user ✓");

    // 10. Verify "Delete account" section is NOT visible
    await expect(deleteAccountHeading).not.toBeVisible();
    log("'Delete account' section not visible for suspended user ✓");

    // 11. Verify suspended user warning text
    const suspendedWarningText = userPage.getByText(
        /Your account is currently suspended. To request account deletion, please use the appeal system/i,
    );
    await expect(suspendedWarningText).toBeVisible();
    log("Suspended user warning text visible ✓");

    // 12. Verify normal warning is NOT visible
    await expect(normalWarningText).not.toBeVisible();
    log("Normal warning text not visible for suspended user ✓");

    // 13. Verify "Deletion request" link/button exists
    const deletionRequestLink = userPage.locator('a.btn.reject:has-text("Deletion request")');
    await expect(deletionRequestLink).toBeVisible();
    log("'Deletion request' link visible for suspended user ✓");

    // 14. Verify "Delete account" button is NOT visible
    await expect(deleteAccountButton).not.toBeVisible();
    log("'Delete account' button not visible for suspended user ✓");

    // 15. Verify the link goes to /appeal
    const linkHref = await deletionRequestLink.getAttribute("href");
    expect(linkHref).toBe("/appeal");
    log("'Deletion request' link points to /appeal ✓");

    // 16. Click the link and verify navigation to appeal page
    log("Clicking 'Deletion request' link...");
    await deletionRequestLink.click();
    await userPage.waitForLoadState("networkidle");

    // 17. Verify we're on the appeal page
    await expect(userPage).toHaveURL(/\/appeal/);
    log("Navigated to appeal page ✓");

    // 18. Verify appeal page content is visible (suspended user sees different heading)
    const appealHeading = userPage.getByRole("heading", {
        name: /Your account has been suspended/i,
    });
    await expect(appealHeading).toBeVisible();
    log("Appeal page content visible ✓");

    log("=== Suspended User Deletion Request Test Complete ===");
    log("✓ Normal users see 'Delete account' button");
    log("✓ Suspended users see 'Deletion request' section");
    log("✓ Suspended users see correct warning text");
    log("✓ 'Deletion request' link navigates to appeal page");
};
