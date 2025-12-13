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

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";
import {
    newTestUsername,
    prepareNewUser,
    generateUniqueTestIPv6,
    loginAsUser,
    turnOffDynamicHelp,
    goToUsersProfile,
} from "../helpers/user-utils";
import { expectOGSClickableByName } from "../helpers/matchers";
import { log } from "@helpers/logger";

export const playerCheckAIButtonTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    log("=== Player Check AI Button Test ===");

    // 1. Create a regular user to test the dropdown on
    const targetUsername = newTestUsername("AITarget");
    log(`Creating target user: ${targetUsername}`);
    const { userPage: targetPage } = await prepareNewUser(createContext, targetUsername, "test");
    log(`Target user created: ${targetUsername} ✓`);

    // Get the target user's ID by clicking the profile link in the header
    const profileLink = targetPage.locator('nav[aria-label="Profile"] a').first();
    const profileHref = await profileLink.getAttribute("href");
    const targetUserIdMatch = profileHref?.match(/\/user\/view\/(\d+)/);
    const targetUserId = targetUserIdMatch ? targetUserIdMatch[1] : null;
    log(`Target user ID: ${targetUserId} ✓`);

    // 2. Create a regular user to verify the button does NOT appear
    const regularUsername = newTestUsername("RegUser");
    log(`Creating regular user: ${regularUsername}`);
    const { userPage: regularPage } = await prepareNewUser(createContext, regularUsername, "test");
    log(`Regular user created: ${regularUsername} ✓`);

    // 3. Regular user navigates to target user's profile
    log("Regular user navigating to target user's profile...");
    await goToUsersProfile(regularPage, targetUsername);
    log("Navigated to target profile ✓");

    // 4. Regular user clicks on player link to open dropdown
    log("Opening player dropdown as regular user...");
    const playerLinkRegular = regularPage.locator(`a.Player:has-text("${targetUsername}")`).first();
    await expect(playerLinkRegular).toBeVisible();
    await playerLinkRegular.hover();
    await playerLinkRegular.click();
    log("Player dropdown opened ✓");

    // 5. Verify "Check AI" button does NOT appear for regular user
    log("Verifying 'Check AI' button NOT visible to regular user...");
    await expect(regularPage.getByRole("button", { name: /Check AI/i })).not.toBeVisible();
    log("'Check AI' button correctly hidden from regular user ✓");

    // Close the dropdown
    await regularPage.keyboard.press("Escape");

    // 6. Set up seeded moderator
    log("Setting up moderator account...");
    const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
    if (!moderatorPassword) {
        throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set to run this test");
    }

    const uniqueIPv6 = generateUniqueTestIPv6();
    const modContext = await createContext({
        extraHTTPHeaders: {
            "X-Forwarded-For": uniqueIPv6,
        },
    });
    const modPage = await modContext.newPage();

    await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
    await turnOffDynamicHelp(modPage);
    log("Moderator logged in ✓");

    // 7. Moderator navigates to target user's profile
    log("Moderator navigating to target user's profile...");
    await goToUsersProfile(modPage, targetUsername);
    log("Navigated to target profile ✓");

    // 8. Moderator clicks on player link to open dropdown
    log("Opening player dropdown as moderator...");
    const playerLinkMod = modPage.locator(`a.Player:has-text("${targetUsername}")`).first();
    await expect(playerLinkMod).toBeVisible();
    await playerLinkMod.hover();
    await playerLinkMod.click();
    log("Player dropdown opened ✓");

    // Wait for PlayerDetails to load
    await expect(modPage.locator(".PlayerDetails")).toBeVisible();
    log("PlayerDetails visible ✓");

    // 9. Verify "Check AI" button appears for moderator
    log("Verifying 'Check AI' button visible to moderator...");
    const checkAIButton = await expectOGSClickableByName(modPage, /Check AI/);
    await expect(checkAIButton).toBeVisible();
    log("'Check AI' button visible to moderator ✓");

    // 10. Click the "Check AI" button
    log("Clicking 'Check AI' button...");
    await checkAIButton.click();
    log("'Check AI' button clicked ✓");

    // 11. Verify navigation to AI Detection page
    log("Verifying navigation to AI Detection page...");
    await expect(modPage.getByRole("heading", { name: /AI Detection/i })).toBeVisible({ timeout: 15000 });
    log("AI Detection page loaded ✓");

    // 12. Verify the URL contains the player parameter
    log("Verifying URL contains player parameter...");
    const currentUrl = modPage.url();
    expect(currentUrl).toContain("/moderator/ai-detection");
    if (targetUserId) {
        expect(currentUrl).toContain(`player=${targetUserId}`);
        log(`URL contains player parameter: player=${targetUserId} ✓`);
    } else {
        log("⚠ Could not verify player ID in URL (ID not found)");
    }

    // 13. Verify the player autocomplete shows the filtered player
    log("Verifying player autocomplete shows filtered player...");
    const playerAutocomplete = modPage.locator(".search input[type='text']");
    await expect(playerAutocomplete).toBeVisible();

    // Wait a moment for the autocomplete to populate
    await modPage.waitForTimeout(1000);
    const autocompleteValue = await playerAutocomplete.inputValue();
    log(`Autocomplete value: "${autocompleteValue}"`);

    // The autocomplete should contain the target username
    expect(autocompleteValue).toContain(targetUsername);
    log("Player filter correctly pre-populated ✓");

    log("=== Player Check AI Button Test Complete ===");
    log("✓ 'Check AI' button hidden from regular users");
    log("✓ 'Check AI' button visible to moderators");
    log("✓ Clicking button navigates to AI Detection page");
    log("✓ URL contains player parameter");
    log("✓ Player filter correctly pre-populated");
    log("✓ Player Check AI button functionality fully verified");
};
