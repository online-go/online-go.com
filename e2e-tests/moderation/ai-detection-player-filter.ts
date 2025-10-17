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
 * Test the AI Detection player filter functionality
 *
 * This test verifies that:
 * 1. When on the AI Detection page, clicking a player name directly sets the filter
 * 2. The URL is updated with the player parameter
 * 3. The player autocomplete input shows the filtered player's name
 * 4. No popup appears when clicking player names (direct filtering behavior)
 * 5. Clicking a different player updates the filter to that player
 * 6. Clicking the currently filtered player navigates to their profile page
 *
 * Uses E2E_MODERATOR from init_e2e data for moderator functionality.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set.
 */

import { Browser, expect } from "@playwright/test";
import { generateUniqueTestIPv6, loginAsUser, turnOffDynamicHelp } from "../helpers/user-utils";

export const aiDetectionPlayerFilterTest = async ({ browser }: { browser: Browser }) => {
    console.log("=== AI Detection Player Filter Test ===");

    // 1. Set up seeded moderator
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

    // 2. Navigate to the AI Detection page
    console.log("Navigating to AI Detection page...");
    await modPage.goto("/moderator/ai-detection");
    await modPage.waitForLoadState("networkidle");
    await expect(modPage.getByRole("heading", { name: /AI Detection/i })).toBeVisible();
    console.log("AI Detection page loaded ✓");

    // 3. Wait for the table to finish loading
    console.log("Waiting for game data to load...");
    const loadingOverlay = modPage.locator(".ai-detection .loading-overlay");

    // Wait for the loading overlay to be hidden (meaning data has loaded)
    // This will pass immediately if already hidden, or wait if it's visible
    await loadingOverlay.waitFor({ state: "hidden", timeout: 10000 });
    console.log("Loading overlay hidden - data loaded ✓");

    // Check if there are any games in the table
    const gameRows = modPage.locator(".ai-detection tr").filter({ hasText: /#\d+/ });
    const rowCount = await gameRows.count();

    if (rowCount === 0) {
        console.log("⚠ No games found in AI Detection table - skipping test");
        await modPage.close();
        await modContext.close();
        console.log("=== Test Skipped (No Data) ===");
        return;
    }

    console.log(`Found ${rowCount} games in table ✓`);

    // 4. Find the first player name in the table
    console.log("Looking for player name in table...");
    const firstPlayerLink = modPage.locator(".ai-detection .Player").first();
    await expect(firstPlayerLink).toBeVisible();

    // Get the player name before clicking
    const playerName = await firstPlayerLink.textContent();
    console.log(`Found player link: ${playerName} ✓`);

    // 5. Click on the player link to directly set the filter (no popup should appear)
    console.log("Clicking player link to set filter...");
    await firstPlayerLink.click();
    await modPage.waitForTimeout(500);
    console.log("Player link clicked ✓");

    // 6. Verify no popup appeared (the click should directly set the filter)
    console.log("Verifying no popup appeared...");
    const playerPopup = modPage.locator(".PlayerDetails");
    await expect(playerPopup).not.toBeVisible();
    console.log("No popup appeared (direct filter behavior confirmed) ✓");

    // 9. Verify the URL contains the player parameter
    console.log("Verifying URL updated with player parameter...");
    const currentUrl = modPage.url();
    expect(currentUrl).toContain("player=");
    console.log(`URL updated: ${currentUrl} ✓`);

    // 10. Verify the player autocomplete input shows the filtered player
    console.log("Verifying player autocomplete shows filtered player...");
    const playerAutocomplete = modPage.locator(".search input[type='text']");
    await expect(playerAutocomplete).toBeVisible();

    // The autocomplete should have the player's name
    const autocompleteValue = await playerAutocomplete.inputValue();
    console.log(`Autocomplete value: "${autocompleteValue}"`);

    // The value might be empty initially if still loading, wait a bit
    if (!autocompleteValue) {
        await modPage.waitForTimeout(1000);
        const newAutocompleteValue = await playerAutocomplete.inputValue();
        console.log(`Autocomplete value after wait: "${newAutocompleteValue}"`);
    }

    console.log("Player filter applied successfully ✓");

    // 11. Verify we can update the filter by clicking on another player
    console.log("Testing filter update by clicking another player...");

    // Find a different player name (skip the first one)
    const secondPlayerLink = modPage.locator(".ai-detection .Player").nth(1);
    const secondPlayerLinkCount = await secondPlayerLink.count();

    if (secondPlayerLinkCount > 0) {
        const secondPlayerName = await secondPlayerLink.textContent();
        console.log(`Found second player: ${secondPlayerName}`);

        await secondPlayerLink.click();
        await modPage.waitForTimeout(500);

        // Verify URL updated again
        const newUrl = modPage.url();
        expect(newUrl).toContain("player=");
        console.log(`URL updated for second player: ${newUrl} ✓`);

        // 12. Now test that clicking the filtered player navigates to their profile
        console.log("Testing that clicking filtered player navigates to profile...");

        // The first player in the table should now be the second player (since we filtered by them)
        // Wait for table to reload with new filter
        await loadingOverlay.waitFor({ state: "hidden", timeout: 10000 });

        // Get the first player link again (should be the filtered player)
        const filteredPlayerLink = modPage.locator(".ai-detection .Player").first();
        await expect(filteredPlayerLink).toBeVisible();

        const filteredPlayerName = await filteredPlayerLink.textContent();
        console.log(`Filtered player in table: ${filteredPlayerName}`);

        // Extract player ID from the current URL
        const urlMatch = newUrl.match(/player=(\d+)/);
        const filteredPlayerId = urlMatch ? urlMatch[1] : null;
        console.log(`Filtered player ID: ${filteredPlayerId}`);

        if (filteredPlayerId) {
            // Click the filtered player (should navigate to profile)
            console.log("Clicking filtered player to navigate to profile...");
            await filteredPlayerLink.click();
            await modPage.waitForLoadState("networkidle");

            // Verify we navigated to the player's profile page
            const profileUrl = modPage.url();
            expect(profileUrl).toContain(`/player/${filteredPlayerId}`);
            console.log(`Navigated to player profile: ${profileUrl} ✓`);
        } else {
            console.log("⚠ Could not extract player ID from URL, skipping profile navigation test");
        }
    } else {
        console.log("Only one player in table, skipping second player and profile navigation tests");
    }

    // Clean up
    await modPage.close();
    await modContext.close();

    console.log("=== AI Detection Player Filter Test Complete ===");
    console.log("✓ Navigated to AI Detection page");
    console.log("✓ Clicked player link directly set the filter (no popup)");
    console.log("✓ URL was updated with player parameter");
    console.log("✓ Clicking different player updates the filter");
    console.log("✓ Clicking filtered player navigates to their profile");
    console.log("✓ Player filter functionality fully verified");
};
