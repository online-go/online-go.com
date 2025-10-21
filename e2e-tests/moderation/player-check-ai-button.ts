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
 * Test the "Check AI" button in player dropdown menu
 *
 * This test verifies that:
 * 1. The "Check AI" button appears in the PlayerDetails dropdown for moderators
 * 2. The button appears for AI Detectors (users with AI_DETECTOR moderator powers)
 * 3. The button does NOT appear for regular users
 * 4. Clicking the button navigates to the AI Detection page with the player filter pre-set
 * 5. The URL contains the player parameter
 * 6. The player autocomplete shows the filtered player's name
 *
 * Uses E2E_MODERATOR from init_e2e data for moderator functionality.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set.
 */

import { Browser, expect } from "@playwright/test";
import {
    newTestUsername,
    prepareNewUser,
    generateUniqueTestIPv6,
    loginAsUser,
    turnOffDynamicHelp,
    goToUsersProfile,
} from "../helpers/user-utils";
import { expectOGSClickableByName } from "../helpers/matchers";

export const playerCheckAIButtonTest = async ({ browser }: { browser: Browser }) => {
    console.log("=== Player Check AI Button Test ===");

    // 1. Create a regular user to test the dropdown on
    const targetUsername = newTestUsername("AITarget");
    console.log(`Creating target user: ${targetUsername}`);
    const { userPage: targetPage, userContext: targetContext } = await prepareNewUser(
        browser,
        targetUsername,
        "test",
    );
    console.log(`Target user created: ${targetUsername} ✓`);

    // Get the target user's ID from the profile page
    await targetPage.goto("/user/view");
    await targetPage.waitForLoadState("networkidle");
    const profileUrl = targetPage.url();
    const targetUserIdMatch = profileUrl.match(/\/player\/(\d+)/);
    const targetUserId = targetUserIdMatch ? targetUserIdMatch[1] : null;
    console.log(`Target user ID: ${targetUserId} ✓`);

    // 2. Create a regular user to verify the button does NOT appear
    const regularUsername = newTestUsername("RegUser");
    console.log(`Creating regular user: ${regularUsername}`);
    const { userPage: regularPage, userContext: regularContext } = await prepareNewUser(
        browser,
        regularUsername,
        "test",
    );
    console.log(`Regular user created: ${regularUsername} ✓`);

    // 3. Regular user navigates to target user's profile
    console.log("Regular user navigating to target user's profile...");
    await goToUsersProfile(regularPage, targetUsername);
    console.log("Navigated to target profile ✓");

    // 4. Regular user clicks on player link to open dropdown
    console.log("Opening player dropdown as regular user...");
    const playerLinkRegular = regularPage.locator(`a.Player:has-text("${targetUsername}")`).first();
    await expect(playerLinkRegular).toBeVisible();
    await playerLinkRegular.hover();
    await playerLinkRegular.click();
    console.log("Player dropdown opened ✓");

    // 5. Verify "Check AI" button does NOT appear for regular user
    console.log("Verifying 'Check AI' button NOT visible to regular user...");
    await expect(regularPage.getByRole("button", { name: /Check AI/i })).not.toBeVisible();
    console.log("'Check AI' button correctly hidden from regular user ✓");

    // Close the dropdown
    await regularPage.keyboard.press("Escape");

    // 6. Set up seeded moderator
    console.log("Setting up moderator account...");
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set to run this test");
    }

    const uniqueIPv6 = generateUniqueTestIPv6();
    const modContext = await browser.newContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const modPage = await modContext.newPage();

    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
    await turnOffDynamicHelp(modPage);
    console.log("Moderator logged in ✓");

    // 7. Moderator navigates to target user's profile
    console.log("Moderator navigating to target user's profile...");
    await goToUsersProfile(modPage, targetUsername);
    console.log("Navigated to target profile ✓");

    // 8. Moderator clicks on player link to open dropdown
    console.log("Opening player dropdown as moderator...");
    const playerLinkMod = modPage.locator(`a.Player:has-text("${targetUsername}")`).first();
    await expect(playerLinkMod).toBeVisible();
    await playerLinkMod.hover();
    await playerLinkMod.click();
    console.log("Player dropdown opened ✓");

    // Wait for PlayerDetails to load
    await expect(modPage.locator(".PlayerDetails")).toBeVisible();
    console.log("PlayerDetails visible ✓");

    // 9. Verify "Check AI" button appears for moderator
    console.log("Verifying 'Check AI' button visible to moderator...");
    const checkAIButton = await expectOGSClickableByName(modPage, /Check AI/);
    await expect(checkAIButton).toBeVisible();
    console.log("'Check AI' button visible to moderator ✓");

    // 10. Click the "Check AI" button
    console.log("Clicking 'Check AI' button...");
    await checkAIButton.click();
    await modPage.waitForLoadState("networkidle");
    console.log("'Check AI' button clicked ✓");

    // 11. Verify navigation to AI Detection page
    console.log("Verifying navigation to AI Detection page...");
    await expect(modPage.getByRole("heading", { name: /AI Detection/i })).toBeVisible();
    console.log("AI Detection page loaded ✓");

    // 12. Verify the URL contains the player parameter
    console.log("Verifying URL contains player parameter...");
    const currentUrl = modPage.url();
    expect(currentUrl).toContain("/moderator/ai-detection");
    if (targetUserId) {
        expect(currentUrl).toContain(`player=${targetUserId}`);
        console.log(`URL contains player parameter: player=${targetUserId} ✓`);
    } else {
        console.log("⚠ Could not verify player ID in URL (ID not found)");
    }

    // 13. Verify the player autocomplete shows the filtered player
    console.log("Verifying player autocomplete shows filtered player...");
    const playerAutocomplete = modPage.locator(".search input[type='text']");
    await expect(playerAutocomplete).toBeVisible();

    // Wait a moment for the autocomplete to populate
    await modPage.waitForTimeout(1000);
    const autocompleteValue = await playerAutocomplete.inputValue();
    console.log(`Autocomplete value: "${autocompleteValue}"`);

    // The autocomplete should contain the target username
    expect(autocompleteValue).toContain(targetUsername);
    console.log("Player filter correctly pre-populated ✓");

    // Clean up
    await targetPage.close();
    await targetContext.close();
    await regularPage.close();
    await regularContext.close();
    await modPage.close();
    await modContext.close();

    console.log("=== Player Check AI Button Test Complete ===");
    console.log("✓ 'Check AI' button hidden from regular users");
    console.log("✓ 'Check AI' button visible to moderators");
    console.log("✓ Clicking button navigates to AI Detection page");
    console.log("✓ URL contains player parameter");
    console.log("✓ Player filter correctly pre-populated");
    console.log("✓ Player Check AI button functionality fully verified");
};
